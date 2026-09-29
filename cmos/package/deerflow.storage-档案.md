# deerflow.storage-档案

## 一、这个包是干什么的

这个包是内容寻址的blob存储。

有些字节需要在每个实例上都能解析。
不只是写在它的那台机器上。
例如跨多个Gateway部署时。
一台机器上的本地文件路径对另一台机器没有意义。
而内容的SHA-256摘要到处都有意义。
每个能到达后端存储的实例都能解析出同样的字节。

这个包就是为这个需求服务的。

地址就是内容的SHA-256。
所以写入是幂等的。
同样的字节放两次得到同一个引用。
去重是免费的。
读取时可以对照地址验证拿回的字节。

这个包默认是关闭的。
`blob_storage.enabled`默认False。
没有任何生产者被迁移过来。
没动过的部署行为完全不变。

## 二、包里的主要成员

### （一）模块__init__.py——公共出口

导出契约和工厂的全部公共API。

- 契约。`BlobRef`、`BlobStore`、`BlobStoreError`家族、`validate_blob_kind`、`is_valid_blob_kind`。
- 工厂。`get_blob_store`、`get_blob_store_if_enabled`、`reset_blob_store`。

### （二）模块contract.py——契约层

#### 1、BlobRef数据类

`BlobRef`寻址内容，不寻址位置。
这是抽象的全部意义。

字段有四个。

- sha256。小写十六进制的SHA-256，64字符。
- size。字节长度。
- kind。内容类别。例如viewed-image、tool-output。
- content_type。MIME类型，可选。

sha256有校验器。
必须是64位小写十六进制。
kind有校验器。
必须是安全的blob-kind标识。

`matches`方法验证一段字节是不是这个blob的内容。
验证用长度加哈希。

#### 2、kind语法

`_KIND_PATTERN`定义kind的语法。
kind同时是local_fs后端里的文件系统路径段。
所以语法刻意收窄。

- 只允许小写字母、数字、连字符。
- 不能以连字符开头或结尾。
- 长度1到64字符。

语法排除了路径穿越（`..`）、分隔符、NTFS/APFS的大小写意外。
在契约层就排除，而不是让每个后端自己检查。

`validate_blob_kind`返回kind原值，或抛ValueError。
错误消息里引用真正的语法。
后端不能重实现这个模式。
一个后端拒绝契约接受的kind，会让内容在一个后端可寻址、另一个后端不可寻址。

#### 3、BlobStore抽象类

`BlobStore`是后端中立的契约。
它是普通ABC。
契约不带配置字段。

核心方法有三个。

- `from_config`从后端私有配置构建store。配置不可用必须抛错。静默起在错误root上的store比拒绝启动的更糟。
- `put_bytes`持久化字节并返回`BlobRef`。幂等。同样的字节放两次返回同一个ref，不重复存储。thread_id只是建议性的来源记录，永远不是引用计数。内容寻址意味着相同字节合并成一个对象。两个线程外部化同样的内容会共享它。后端只能记录先到达的那个写入者。
- `get_bytes`返回ref寻址的内容。内容不在抛`BlobNotFoundError`。内容在但读不了抛`BlobReadError`。后端应该在读取时验证摘要。静默返回错误字节的内容寻址存储和损坏的checkpoint无法区分。

辅助方法有默认实现。

- `exists`默认通过get_bytes探测。
- `delete`默认抛错。不能删除的后端要明说，而不是让调用方以为清理成功了。删除不存在的blob不是错误。幂等。
- `close`默认无操作。

`STORE_CLASS_ATTR`是哨兵属性名。
每个后端包的`__init__`暴露这个属性。
文件夹扫描工厂靠它发现后端。

#### 4、错误家族

错误家族是后端中立的。

- `BlobStoreError`。基类。
- `BlobNotConfiguredError`。调用方需要store但blob_storage.enabled是False。
- `BlobWriteError`。重试后写失败，内容没有持久化。
- `BlobReadError`。除"内容不在"之外的读失败。
- `BlobNotFoundError`。引用的内容不在后端里。

#### 5、可移植性规则

后端通过两个通道与宿主交互。
方法参数。
backend_config字典。
后端文件夹唯一需要的deerflow导入是契约里导入`BlobStore`的那一行。
所以第三方后端可以活在这棵树外面。
用点分路径选择。

### （三）模块manager.py——工厂和单例

#### 1、后端发现

后端包在`storage/backends/<name>/`。
每个包的`__init__`暴露`STORE_CLASS`。
文件夹名等于后端名等于`blob_storage.backend`的值。

`_scan_backends`扫描backends目录。
跳过下划线开头的目录。
导入失败的后端记录日志并跳过。
一个坏的可选后端不能拖垮整个store。
暴露不出`STORE_CLASS`的后端也跳过并告警。

`_resolve_store_class`解析后端名到类。
接受两种形式。

- 注册的后端名。storage/backends/下的文件夹。
- 点分导入路径。`pkg.mod.Class`或`pkg.mod:Class`。用于活在这棵树外的后端。例如扩展或部署本地的后端。

两种形式都对齐memory后端的契约。

#### 2、两个访问器

`get_blob_store_if_enabled`是生产者该用的。
blob_storage.enabled是False时返回None。
None是显式的、可检查的信号。
生产者继续用现有的本地路径代码。

`get_blob_store`是必需store的调用方用的。
store被禁用时抛`BlobNotConfiguredError`。

两个访问器都让调用点不会漂移。

#### 3、单例管理

单例和它的生效配置一起缓存。
配置变化时重建。
热重载的blob_storage编辑在新访问上生效。

被替换的store保持打开。
已经拿到旧store的调用方可以继续用完。
`reset_blob_store`关闭当前和被替换的store。
清空单例和注册表缓存。

#### 4、默认root

`_default_backend_config`提供零配置体验。
root默认指向deer-flow状态目录下的blobs。
绝对路径，与CWD无关。
每个实例落在自己节点上同样的逻辑位置。
单宿主行为不变。

相对root按`runtime_home()`解析。
后端不依赖runtime_home。
和memory工厂同样理由。

## 三、它和谁协作

上游是配置系统。
`blob_storage_config`提供enabled、backend、backend_config。

后端在`storage/backends/`子包。
目前有local_fs。
local_fs是默认后端。
S3是后续的可选extra。

预定的生产者有两个。

- `ViewedImageData.actual_path`。由`view_image_tool`写，由`ViewImageMiddleware`、Gateway artifact路由、IM通道读。
- 被`ToolOutputBudgetMiddleware`外部化的超大工具结果。

两个生产者都保持现有的本地路径。
store禁用时走旧路径。
这个接缝是纯增量的。

它不负责垃圾回收。
一个blob可能被多个线程引用。
内容去重之后就是这样。
清理必须从持久引用建立活性。
持久引用是checkpoint行里对blob的指名。
不能从sidecar的writer_thread_id推断。

## 四、重要性评级

评级：6分。

理由如下。

这个包是新增的基础设施。
它解决跨实例内容寻址这个真实需求。
但默认关闭。
没有生产者被迁移。
没动过的部署行为完全不变。

引用量很小。
只有1个文件直接引用这个包。
加local_fs后端也是1个。

它不在任何核心路径上。
运行、智能体、工具、沙箱都不经过它。
删除它，当前部署没有任何行为变化。

它的价值是前瞻性的。
多实例部署需要共享的字节存储时。
这个契约已经就位。
设计质量高。
契约清晰。
幂等、去重、验证、原子发布都考虑到了。

所以给6分。
现在是低引用的备用设施。
设计是面向未来的。
