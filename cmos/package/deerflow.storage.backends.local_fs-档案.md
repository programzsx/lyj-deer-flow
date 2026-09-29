# deerflow.storage.backends.local_fs-档案

## 一、这个包是干什么的

这个包是blob存储的默认后端。

blob存储的契约要求内容寻址。
内容寻址需要真正的存储介质。
这个包提供最简单的介质。
本地文件系统。

这个包也是迁移桥。
当root指向共享卷时。
例如NFS、EFS、ReadWriteMany的PVC。
这个store已经提供多实例解析。
不需要对象存储依赖。
S3后端是后续的可选extra。
S3实现同样的契约。

## 二、包里的主要成员

### （一）模块__init__.py——STORE_CLASS出口

这个模块持有store类。
它暴露`STORE_CLASS = LocalFsBlobStore`。
工厂的`_scan_backends`靠这个属性发现后端。
文件夹名`local_fs`就是配置里的后端名。

### （二）模块local_fs_store.py——LocalFsBlobStore

#### 1、布局

存储布局是内容寻址加分片的。

- `<root>/<kind>/<sha256[:2]>/<sha256>`。字节本体。
- `<root>/<kind>/<sha256[:2]>/<sha256>.json`。sidecar元数据。

地址是内容的SHA-256。
所以有三个性质。

- 写入幂等。同样的字节再放一次，发现文件已在，什么都不做。
- 去重免费。两个外部化同样输出的生产者共享一个文件。
- 读取可验证。读者可以对照地址验证拿回的字节。这就是"哪个内容"能安全替代"在这台机器的哪里"的原因。

#### 2、sidecar元数据

sidecar携带字节本身说不出的信息。

- content_type。MIME类型。
- writer_thread_id。第一个写入的线程。
- created_at。创建时间。

读取不依赖sidecar。
sidecar丢失或截断不能让blob内容不可读。
sidecar也不是引用计数。
writer_thread_id记录先到的写入者。
相同字节合并成一个文件。
所以清理必须先确认没有存活的引用需要这个内容。
才能unlink它。

sidecar写入失败不影响put结果。
sidecar是给后续垃圾回收的优化。
不是读取的依赖。
失败时清理临时文件并告警。

#### 3、put_bytes方法

`put_bytes`持久化字节。

流程分几步。

- 校验kind。通过`validate_blob_kind`。
- 检查大小。超过64MB的put被拒绝。这是后端层的纵深防御上限。不是契约的一部分。
- 计算SHA-256摘要。
- 构造BlobRef。
- 文件已存在时。确认sidecar存在（早前的put可能在两次写之间崩溃）。然后返回。
- 文件不存在时。创建分片目录。创建唯一临时文件。写入并fsync。用os.replace移入位置。写sidecar。
- 异常时清理临时文件。

#### 4、get_bytes方法

`get_bytes`返回ref寻址的内容。

流程分几步。

- 读文件。不存在抛`BlobNotFoundError`。其他OS错误抛`BlobReadError`。
- 对照地址验证。
- 长度不匹配抛`BlobReadError`。长度差指向截断或部分写入。
- 摘要不匹配抛`BlobReadError`。摘要差指向同长度的损坏（位腐）。
- 验证通过才返回。

错误消息区分两种检查失败。
长度差和摘要差混在一起会把调试者引向错误方向。
一个说"截断"，一个说"损坏"。

#### 5、exists方法

直接检查数据文件是否存在。
不通过get_bytes探测。
比默认实现更高效。

#### 6、delete方法

删除数据文件和sidecar。
文件不存在跳过。幂等。
删除失败抛`BlobStoreError`。
用中立基类，不用`BlobReadError`。
错误家族从第一天就是公共API。
匹配读失败的调用方不能收到一个失败的unlink。

#### 7、_publish方法和并发

`_publish`把临时文件移入位置。
它容忍并发写入者。

两个Gateway实例可能同时放同一个blob。
两个都往目标目录里的唯一临时文件写。
然后os.replace进位置。
最后一个写入者获胜。内容相同。
读者永远看不到部分文件。

Windows上os.replace在同一卷内是原子的。
所以临时文件创建在目标目录里。
不用全局临时目录。

Windows的os.replace在另一个句柄还打开着目标时会抛PermissionError。
这正是两个实例放同一blob时读者正在读的场景。
处理方式分两步。

- 目标已经是这段内容时。另一个写入者赢了竞态，put完成，丢弃临时文件。
- 否则短暂重试。最多三次。退避递增。然后抛错。

#### 8、构造和from_config

构造函数建立root。
创建root目录。
检查root可写。
不可写抛`BlobWriteError`。

`from_config`从backend_config构建。
root必须存在。
缺失时抛ValueError。
工厂会注入默认root。

## 三、它和谁协作

上游是`deerflow/storage/manager.py`。
工厂扫描发现这个后端。
`blob_storage.backend: local_fs`选中它。

下游是文件系统。
blob按kind和SHA-256分片存放。

契约来源是`deerflow/storage/contract.py`。
它实现`BlobStore`抽象。
它使用`BlobRef`、错误家族、`validate_blob_kind`。

预定的消费者有两个。

- `view_image_tool`的ViewedImageData。
- `ToolOutputBudgetMiddleware`外部化的超大工具结果。

两个都还没迁移到这个store。

## 四、重要性评级

评级：4分。

理由如下。

这个包是blob存储的唯一可用后端。
没有它，`deerflow.storage`的契约就没有实现。
blob存储功能整体不可用。

但它默认关闭。
没有生产者被迁移。
引用量只有1个文件。
删除它，当前部署没有任何行为变化。

它的实现质量高。
内容寻址、幂等、去重、验证、原子发布都考虑到了。
并发写入者的竞态处理细致。
Windows和POSIX都覆盖了。

它不是任何核心路径的一部分。
运行、智能体、工具、沙箱都不经过它。

所以给4分。
作为默认后端它是必需的。
作为当前部署它还没被使用。
