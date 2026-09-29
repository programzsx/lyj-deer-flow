# SandboxRequestLease档案

来源文件：`backend/app/gateway/authz.py`

## 一、这个类是干什么的

这个类是单个Gateway请求对沙箱客户端的租约。

上传和工件路由需要把文件同步到沙箱。

同步之前要先拿到沙箱客户端。

这个类代表"这个请求拿着一个沙箱客户端"。

这个类用dataclass的`slots=True`声明，实例内存占用小。

这个类携带五个信息。

沙箱实例、沙箱id、是否被拒绝、持有者id、沙箱提供方。

`denied`为真表示获取被策略跳过。

策略拒绝时主操作照常进行，只是不做沙箱同步。

这个类最重要的方法是`release()`。

调用方在最后一次客户端操作之后必须调用`release()`释放持有。

## 二、类的成员

这个类是`@dataclass(slots=True)`装饰的数据类。

这个类有五个字段和一个方法。

### 1、字段sandbox

`sandbox`是获取到的沙箱实例，可为`None`。

`denied`为真或提供方恰好丢了实例时为`None`。

### 2、字段sandbox_id

`sandbox_id`是沙箱id字符串，可为`None`。

### 3、字段denied

`denied`是布尔值。

`denied`为真表示`sandbox:execute`门禁拒绝了这次请求。

拒绝是策略决定，不是错误。

### 4、字段owner_id

`owner_id`是请求的持有者id。

持有者id形如`gateway:uuid`。

释放时用这个id归还租约。

### 5、字段provider

`provider`是沙箱提供方实例。

释放时拿这个提供方找租约管理器。

### 6、方法release

`release`释放请求持有。

`owner_id`或`provider`为`None`就直接返回。

释放时先把`owner_id`清空，再调租约管理器的`release_async()`。

先清空再释放的顺序保证释放动作不重入。

## 三、它和谁协作

这个类由`try_acquire_sandbox_for_request()`创建并返回。

那个函数是uploads和artifacts沙箱同步路径的统一入口。

调用方是`ThreadUploadIngestionService`和uploads路由、artifacts路由。

这个类的底层依赖是`deerflow.sandbox.lease`的租约管理器。

## 四、重要性评级

评级：6分。

理由：这个类是沙箱租约在请求层的持有凭证。没有这个类，上传和工件同步的持有和释放就没有统一契约。这个类的`denied`语义把策略拒绝和基础设施错误区分开。这个类的释放是上传管线关闭的必经步骤，泄漏会占住沙箱租约。所以这个类是资源生命周期里重要的请求级组件。
