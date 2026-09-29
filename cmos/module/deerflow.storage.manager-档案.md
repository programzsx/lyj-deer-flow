# deerflow.storage.manager

## 一、这个模块是干什么的

这个模块是blob存储的工厂。

背景是这样的。

blob存储有契约。

契约有多个后端实现。

调用方需要拿到一个可用的存储实例。

这个模块负责选择和构建。

后端选择方式是这样的。

后端包放在storage/backends/目录下。

每个包的__init__暴露STORE_CLASS。

配置里blob_storage.backend指明用哪个。

也可以指一个点分导入路径。

指向放在别处的后端。

这个模块维护一个进程级单例。

同样的配置快照返回同一个实例。

配置变了就重建。

被换掉的实例保持存活。

因为调用方手里可能还拿着旧实例。

配置里blob_storage.enabled默认是关的。

所以有两个访问器。

一个是有开关就返回，没有返回None。

一个是必须要有，没有就报错。

解析不了后端就快速失败。

存储静默启动在错误的后端上比拒绝启动更糟。

## 二、模块里的主要成员

- get_blob_store_if_enabled：生产者应该用的访问器。开关关闭时返回None。None是明确的可检查信号。
- get_blob_store：必须有存储的调用方用。开关关闭时抛BlobNotConfiguredError。
- _get_blob_store_if_enabled：内部实现。在单例锁下按配置快照选实例。
- _resolve_store_class(backend)：按名字解析后端类。支持内置名字和点分导入路径。
- _scan_backends：扫描内置后端目录。找出暴露STORE_CLASS的包。
- reset_blob_store：重置单例。测试用。
- _resolve_backend_config：解析后端私有配置。host没设root时注入默认值。

## 三、它和谁协作

- 它依赖storage/contract的契约和错误类型。
- 它依赖config/blob_storage_config读取配置。
- 它负责加载storage/backends/local_fs等后端包。
- 它被所有需要blob存储的调用方使用。

## 四、重要性评级

评级是4分。

理由是它是blob存储的接入点。

两个访问器的设计防止调用方漂移。

快速失败的设计防止存储静默错配。

但blob存储默认关闭。

当前只有本地文件系统后端。

使用面还比较小。
