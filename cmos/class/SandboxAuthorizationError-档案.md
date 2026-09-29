# SandboxAuthorizationError档案

源码位置：backend/packages/harness/deerflow/sandbox/exceptions.py

## 一、这个类是干什么的

SandboxAuthorizationError是一个沙箱异常类。

SandboxAuthorizationError表示调用者的角色被拒绝沙箱执行。

授权的阶段是第三阶段的可插拔授权。authorize("sandbox", "execute")在沙箱获取之前检查。拒绝时这个异常向上传播。传播穿过工具的执行。Agent的工具错误处理把它转成友好的ToolMessage。友好消息是"sandbox not permitted for your role"。不是崩溃整个运行。

SandboxAuthorizationError继承SandboxError。details里带role。

## 二、类的成员

（一）字段

- role：被拒绝的角色。默认None。非None时进details。

## 三、它和谁协作

（一）产生者

deerflow/authz/sandbox_authz.py的授权门抛它。authorize_sandbox_execution和authorize_sandbox_execution_async是同步和异步的授权入口。

SandboxMiddleware的before_agent也捕获它。共享视图的运行被拒绝时跳过eager获取。延迟到第一个沙箱工具调用。

（二）消费者

工具层捕获它。把异常转成友好的错误ToolMessage。

## 四、重要性评级

评级：5分。

理由：SandboxAuthorizationError是沙箱授权门的标准拒绝信号。它的传播路径设计让拒绝变成友好的ToolMessage而不是崩溃运行。eager路径和lazy路径共享同样的语义。这是安全边界的载体。给5分。
