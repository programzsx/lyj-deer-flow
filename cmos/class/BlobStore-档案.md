# BlobStore-档案

## 一、这个类是干什么的

BlobStore是storage/contract.py里的抽象基类。

它是内容寻址blob存储的中立契约。

BlobRef寻址的是内容。不是位置。

这是整个抽象的关键点。

多Gateway部署下服务器本地路径只在写入实例上有意义。

内容摘要在所有地方都有意义。

每个能到达后端的实例解析出相同的字节。

生产者有两处。

view_image_tool写的ViewedImageData.actual_path。

ToolOutputBudgetMiddleware外置的超大工具结果。

store禁用时两处都保留本地路径。

所以接缝是纯增量的。

这个类位于backend/packages/harness/deerflow/storage/contract.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、BlobRef模型

BlobRef是冻结的pydantic模型。

字段是sha256、size、kind、content_type。

sha256是地址。写入是幂等的。

相同字节放两次得到相同ref。去重免费。

size让读者不信任后端也能校验拿回的东西。

kind划定垃圾回收范围。

保留清扫能按kind推理。不用解析路径。

sha256验证必须是64位小写十六进制。

### 2、blob kind语法

blob kind也是local_fs后端的文件系统路径段。

所以语法刻意收窄。

小写字母、数字、连字符。

无首尾连字符。1到64字符。

这在契约层排除路径穿越、分隔符、NTFS大小写意外。

后端不得重新实现模式。

一个后端拒绝契约接受的kind会让内容只在一个后端可寻址。

### 3、错误层级

BlobStoreError是中立的基类错误。

BlobNotConfiguredError是调用方要求store但blob_storage.enabled为False。

BlobWriteError是重试后写入失败。内容未持久化。

BlobReadError是blob缺席以外的读取失败。

BlobNotFoundError是引用的内容不存在。

### 4、BlobStore抽象方法

from_config从后端私有配置构建store。

配置不可用时必须抛出。

静默起在错误root上的store比拒绝启动更糟。

put_bytes持久化数据并返回BlobRef。

幂等。相同字节不重复存储。

thread_id是advisory来源信息。永远不是引用计数。

相同内容跨线程共享一个对象。

后端只能记录先到的写者。

多实例部署下连这个都不可靠。

垃圾回收必须从持久引用建立活性。

持久引用是命名blob的checkpoint行。

get_bytes返回内容。

缺席抛BlobNotFoundError。存在但不可读抛BlobReadError。

后端应该在读时验证摘要。

静默返回错误字节的内容寻址store和损坏的checkpoint无法区分。

### 5、默认方法

exists默认通过get_bytes探测。

delete默认抛出。

不能删除的后端要说出来。

删除缺席blob不是错误。幂等。

close默认无操作。

### 6、可移植规则

后端通过恰好两个通道接触宿主。

方法参数和backend_config字典。

后端文件夹唯一需要的deerflow导入是契约里的BlobStore。

### 7、manager.py工厂

storage/manager.py是文件夹扫描工厂加进程单例。

后端在storage/backends/<name>/。

每个包的__init__暴露STORE_CLASS。

接受两种后端形式。

注册的后端名。

点分导入路径。

get_blob_store_if_enabled是生产者应该用的访问器。

禁用时返回None。未迁移的调用点是no-op不是事故。

get_blob_store供要求store的调用方使用。禁用时抛BlobNotConfiguredError。

两者在后端不可解析时fail fast。

根默认为deer-flow状态目录。绝对路径。与CWD无关。

相对root相对runtime_home解析。

单例锁下对一个配置快照选择store。

被替换的store保持存活直到reset。已持有它的调用方能用完。

## 三、它和谁协作

- view_image_tool和ToolOutputBudgetMiddleware是生产者。
- LocalFsBlobStore是local_fs后端实现。
- get_blob_store_if_enabled是访问入口。
- checkpoint行命名blob。支撑垃圾回收活性。

## 四、重要性评级

评级是7分。

理由如下。

这个契约是内容寻址外置存储的核心。

BlobRef让内容跨实例有意义。

thread_id不是引用计数的规则防止错误的垃圾回收。

kind语法在契约层排除路径穿越。

后端必须在读时验证摘要。

工厂的fail-fast防止静默起错后端。

这些是外置存储正确性的关键。

扣掉3分。

扣分原因是它默认禁用。使用面还小。
