# deerflow.storage.contract

## 一、这个模块是干什么的

这个模块定义内容寻址blob存储的契约。

背景是这样的。

大块内容需要存储。

比如代理看过的图片。

比如外部化的超大工具输出。

这些内容需要一个地址。

地址指向内容本身。

这个契约的核心思想是内容寻址。

BlobRef指向的是内容。

不是位置。

这一点在多网关部署下至关重要。

服务器本地路径只在写入的那台机器上有意义。

内容摘要到处都有意义。

每个能到达存储的实例解析出同样的字节。

这个契约定义了BlobRef。

定义了BlobStore抽象。

定义了错误类型。

Blob kind也在这里校验。

kind是文件路径段。

所以kind的语法刻意收窄。

只允许小写字母、数字、连字符。

拒绝路径穿越和分隔符。

在契约层就挡住，而不是每个后端各自再查一遍。

## 二、模块里的主要成员

- BlobRef：内容寻址的引用。包含sha256、size、kind、content_type。是Pydantic模型。
- BlobStore：后端无关的抽象基类。定义put_bytes、get_bytes、exists。
- put_bytes：持久化字节并返回BlobRef。幂等。同样的字节存两次不重复。thread_id只是来源记录，不是引用计数。
- get_bytes：按引用读字节。内容不存在抛BlobNotFoundError。存在但读不了抛BlobReadError。
- from_config：从后端私有配置构建存储。配置不可用必须报错。
- STORE_CLASS_ATTR：每个后端包暴露的哨兵属性。文件夹扫描工厂靠它找后端。
- validate_blob_kind：校验kind。不符合语法抛ValueError。
- BlobStoreError、BlobNotConfiguredError、BlobWriteError、BlobReadError、BlobNotFoundError：错误类型。

## 三、它和谁协作

- 它被storage/manager.py引用。工厂按契约构建后端。
- 它被storage/backends/local_fs/local_fs_store.py实现。
- 它被config/blob_storage_config.py引用。
- 生产者按契约写blob，比如图片数据和工具输出。

## 四、重要性评级

评级是6分。

理由是它是blob存储的公共契约。

内容寻址的设计让多实例部署下的大内容到处可读。

kind语法在契约层收窄是安全设计。

但目前只有本地文件系统一个后端。

它是一个面向未来的抽象，当前使用面还不大。
