# SandboxError档案

源码位置：backend/packages/harness/deerflow/sandbox/exceptions.py

## 一、这个类是干什么的

SandboxError是所有沙箱相关错误的基类。

Sandbox相关异常全部继承它。SandboxError带结构化错误信息。

SandboxError的消息和details字典分开存。details装结构化细节。比如sandbox_id、命令、退出码、路径。

str方法把details拼进消息。拼接的格式是"消息 (k1=v1, k2=v2)"。没有details时只返回消息。

## 二、类的成员

（一）字段

- message：错误消息。
- details：结构化细节字典。默认空字典。

（二）子类

异常类一共九个。

- SandboxNotFoundError：沙箱找不到或不可用。
- SandboxRuntimeError：沙箱运行时不可用或配置错误。
- SandboxCommandError：命令执行失败。details带命令和退出码。
- SandboxFileError：文件操作失败。details带路径和操作名。
- SandboxPermissionError：文件操作的权限错误。继承SandboxFileError。
- SandboxFileNotFoundError：文件或目录没找到。继承SandboxFileError。
- SandboxCapacityExceededError：提供者没有可用容量。
- SandboxAuthorizationError：调用者的角色被拒绝沙箱执行。

## 三、它和谁协作

（一）抛出者

沙箱实现和提供者在失败时抛这些异常。

（二）消费者

工具层捕获这些异常。把异常转成友好的ToolMessage。比如SandboxAuthorizationError被转成"sandbox not permitted for your role"。

## 四、重要性评级

评级：5分。

理由：SandboxError是沙箱错误体系的根基。details结构化设计让错误信息能带上下文。子类体系让调用方能按类型处理。没有它沙箱错误就是裸字符串。给5分。
