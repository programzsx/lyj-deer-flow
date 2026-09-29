# TenkiSandbox-档案

## 一、这个类是干什么的

TenkiSandbox是community/tenki/sandbox.py里的类。

它继承Sandbox。

它是委托给活的Tenki云沙箱的适配器。

每次调用都是沙箱里新鲜的sh -lc exec。

shell状态不存活到下一条命令。

persistent_shell_sessions为False。

这个类位于backend/packages/harness/deerflow/community/tenki/sandbox.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造参数

id是DeerFlow侧沙箱id。provider的缓存键。

sandbox是活的已启动tenki_sandbox.Sandbox。

provider拥有生命周期。close时adapter终止它。

default_env是静态环境。per-call env覆盖。请求级秘密。

home_dir是可写目录。

在沙箱内支撑VIRTUAL_PATH_PREFIX即/mnt/user-data前缀。

on_terminal_failure是可选回调。操作以终端Tenki错误失败时调用。

provider能驱逐死沙箱。

### 2、锁结构

_lock保护closed和fs调用。

_write_lock串行append的read-modify-write。

跨它的三个fs操作。

和_lock分开。

它可以包装整个序列。

per-op驱逐回调会回到provider。

provider以相反顺序锁。

同时持有两个会死锁。

### 3、_is_terminal_failure

BrokenPipeError、ConnectionError、EOFError直接终端。

其他按异常类名在_TERMINAL_ERROR_NAMES里判断。

### 4、close方法

close终止底层Tenki会话。幂等。

微VM先终止。

session真正消失后adapter才标记closed。

失败的终止保持可重试。

不静默泄露运行中计费的沙箱。

终端session错误表示已经消失。算closed。

其他错误抛出让调用方重试或告警。

### 5、_fs_op

_fs_op运行原生sandbox.fs调用。

终端错误时驱逐沙箱。

锁横跨op。不只是fs查找。

同一沙箱的并发调用串行。

Tenki SDK每实例共享一个连接。

和community/e2b_sandbox一样。

_note_failure在锁释放后运行。

它回到provider。provider以相反顺序锁。

同时持有会死锁。

## 三、它和谁协作

- Sandbox是基类契约。
- TenkiSandboxProvider创建并管理它。
- tenki_sandbox的Sandbox是远程实例。
- on_terminal_failure挂provider的invalidate。

## 四、重要性评级

评级是5分。

理由如下。

这个类是Tenki云沙箱的适配器。

close先终止微VM再标记closed。

失败的终止可重试。不泄露计费沙箱。

双锁设计防死锁。

终端错误分类让provider驱逐死沙箱。

这些细节质量不错。

扣掉5分。

扣分原因是它是远程SDK适配器。
