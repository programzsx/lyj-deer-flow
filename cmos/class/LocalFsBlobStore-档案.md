# LocalFsBlobStore-档案

## 一、这个类是干什么的

LocalFsBlobStore是storage/backends/local_fs/local_fs_store.py里的类。

它继承BlobStore。

它是本地文件系统上的内容寻址store。

它是默认后端。

也是迁移桥梁。

root指向共享卷时它已经提供多实例解析。

不需要对象存储依赖。

布局是内容寻址加分片。

路径是<root>/<kind>/<sha256前2位>/<sha256>。

数据文件旁边是.json sidecar元数据。

这个类位于backend/packages/harness/deerflow/storage/backends/local_fs/local_fs_store.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、布局和寻址

地址是内容的SHA-256。

写入是幂等的。相同字节再放一次发现文件已存在。什么也不做。

去重免费。两个外置相同输出的生产者共享一个文件。

读者能对照地址校验拿回的东西。

### 2、构造方法和from_config

构造方法创建root目录。

创建失败或不可写时抛BlobWriteError。

from_config要求backend_config.root。

缺失时抛ValueError。工厂会注入默认。

### 3、put_bytes方法

先validate_blob_kind。

单个put上限64MiB。防御纵深。

计算摘要。文件已存在时幂等返回。

并确保sidecar存在。更早的put可能在两次写入之间崩溃。

新写入用目标目录里的唯一temp文件。

flush加fsync。

然后os.replace发布。

失败时尽力删掉搁浅的temp文件。

temp文件不能积累。

### 4、_publish方法

os.replace在Windows上另一个句柄还开着目标时抛PermissionError。

两个Gateway实例同时put同一blob而读者正在服务时就是这样。

如果目标已是完全相同的内容。另一个写者赢了竞争。put已完成。

否则短暂重试。最多3次。退避0.02秒起。

然后抛出错误。

### 5、get_bytes方法

读文件。

缺席抛BlobNotFoundError。其他OSError抛BlobReadError。

然后对照地址验证。

大小不匹配指向截断或部分写入。

摘要不匹配指向同大小损坏。位腐烂。

混淆两者会把调试者带向错误方向。

错误消息指名是哪个检查失败。

### 6、delete和exists

exists直接查数据文件存在。

delete删数据和sidecar。

失败抛BlobStoreError。

不是BlobReadError。

这个错误家族从第一天就是公开API。

匹配读失败的调用方不能被交给无法读作读失败的unlink错误。

删除缺席blob不报错。

### 7、_write_meta方法

sidecar写content_type、writer_thread_id、创建时间。

读取不依赖sidecar。

丢失或截断的sidecar不能让blob内容不可读。

sidecar也不是引用计数。

writer_thread_id记录先到的写者。

相同字节去重到一个文件。

两个实例追加sidecar是丢更新竞争。

sidecar写失败只警告。不让已成功的put失败。

## 三、它和谁协作

- BlobStore是契约基类。
- BlobRef是寻址模型。
- storage/manager.py的工厂按backend名字解析到它。
- view_image_tool和ToolOutputBudgetMiddleware通过契约使用它。

## 四、重要性评级

评级是6分。

理由如下。

这个类是blob存储的默认后端。

内容寻址、幂等写入、免费去重都在这里落地。

读时验证摘要防止静默坏数据。

大小和摘要分开报告。

os.replace重试处理并发写者竞争。

sidecar丢失不阻塞读取。

这些实现质量高。

扣掉4分。

扣分原因是它是单一后端实现。

可替换。默认还在早期使用阶段。
