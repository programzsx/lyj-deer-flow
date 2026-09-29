# deerflow.sandbox.exceptions档案

## 一、这个模块是干什么的

这个模块定义沙箱相关的异常。异常带结构化的错误信息。

沙箱操作会失败。找不到沙箱。命令执行失败。文件操作失败。权限不够。容量满了。这些失败要有统一的异常类型。调用者靠类型区分失败原因。这个模块定义全部沙箱异常。

这个模块的设计原则是异常携带结构化的details。details是一个dict。带sandbox_id、command、exit_code、path、operation这些结构化字段。方便日志和上层处理。

## 二、模块里的主要成员

### 1、SandboxError基类

全部沙箱异常的基类。

构造函数接收message和可选的details dict。`__str__`方法在有details时把details拼进字符串。格式是`message (k=v, k=v)`。

### 2、SandboxNotFoundError

沙箱找不到或不可用时抛。details带sandbox_id。

### 3、SandboxRuntimeError

沙箱运行时不可用或配置错误时抛。没有额外字段。

### 4、SandboxCommandError

命令执行失败时抛。details带command（截断到100字符）和exit_code。

### 5、SandboxFileError

文件操作失败时抛。details带path和operation。

### 6、SandboxPermissionError和SandboxFileNotFoundError

权限错误和文件找不到。继承SandboxFileError。

### 7、SandboxCapacityExceededError

沙箱provider没有可用容量时抛。

details带code（SANDBOX_CAPACITY_EXCEEDED）、reason（容量满还是provider关闭）、replicas、retryable为true、retry_after_seconds。

调用者控制重试调度。DeerFlow不自动重试。active、warm、reserved非零时也放进details。

### 8、SandboxAuthorizationError

调用者的角色被拒绝沙箱执行时抛。details带role。

这是授权门抛的异常。`authorize("sandbox", "execute")`在沙箱获取之前检查。拒绝时这个异常向上传播。经过工具的执行。Agent的工具错误处理把它转成友好的ToolMessage。消息是"sandbox not permitted for your role"。不崩溃运行。

## 三、它和谁协作

这个模块只依赖标准库。没有任何deerflow内部依赖。

这个模块被`deerflow.sandbox.tools`、`deerflow.sandbox.middleware`、`deerflow.sandbox.local`（本地沙箱实现）、各个社区沙箱provider使用。它们抛这些异常表示失败。

这个模块被授权门使用。`deerflow.authz.sandbox_authz`抛SandboxAuthorizationError。

这个模块被工具的错误处理消费。工具捕获SandboxError转成错误字符串。Agent的错误处理中间件把SandboxAuthorizationError转成友好的ToolMessage。

## 四、重要性评级

评级是6分。

理由。这个模块是全部沙箱异常类型的集中定义。异常类型是调用者区分失败原因的依据。没有统一的类型。各实现就得自己发明异常。调用者没法统一处理。

SandboxAuthorizationError的设计很关键。授权拒绝不是崩溃运行。而是转成友好的ToolMessage。details带role。容量异常带retryable和retry_after_seconds。这些结构化字段让上层可以做正确的处理。

但这个模块是纯定义。没有逻辑。它的重要性依赖于使用它的地方。它本身不执行任何操作。所以重要性是中等。
