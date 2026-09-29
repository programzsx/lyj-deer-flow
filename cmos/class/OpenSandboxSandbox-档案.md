# OpenSandboxSandbox-档案

## 一、这个类是干什么的

OpenSandboxSandbox是community/opensandbox/sandbox.py里的类。

它继承Sandbox。

它包装一个活的opensandbox.sync.SandboxSync实例。

它是远程沙箱。

每次调用都是新鲜的run_command执行。

shell状态不存活到下一条命令。

persistent_shell_sessions为False。

这个类位于backend/packages/harness/deerflow/community/opensandbox/sandbox.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造参数

id是DeerFlow侧沙箱id。

sandbox是活的SandboxSync实例。

run_command_opts_cls是SDK的命令选项类。

default_env是静态环境。

sandbox_timeout是远程生命周期。

default_command_timeout默认600秒。

on_terminal_failure是终端失败回调。

### 2、锁结构

_state_lock保护closed状态。

_operation_lock把每次renew和它的操作放同一锁下。

renew()设置绝对过期。不是取最大值。

后面短文件操作不能缩短长运行命令的horizon。

_append_lock保护追加点。

### 3、destroy方法

destroy终止远程沙箱并关闭SDK资源。

SandboxSync.destroy()即使kill失败也关闭transport。

所以任何结果后这个client都不能安全复用。

closed设为True。

非终端错误时抛出。

api not found算终端。

### 4、renew方法

renew刷新provider拥有的远程的server端生命周期。

sandbox_timeout为None时不做。

closed后抛RuntimeError。

失败时note并抛出。

### 5、_run方法

_run执行命令。

命令超时默认取default_command_timeout。

renewal_timeout取max(sandbox_timeout, sdk_timeout加grace)。

命令的TTL不会短于命令超时。

持锁检查closed。

renew后执行命令。

### 6、辅助函数

_exception_chain提取异常链。

_is_terminal_failure判断终端失败。

api_not_found_is_terminal控制404语义。

format_execution格式化执行结果。

execution_stdout提取stdout。

### 7、TenkiSandbox对照

tenki模块类似结构。

TenkiSandboxProvider继承WarmPoolLifecycleMixin。

TenkiSandbox继承Sandbox。

tenki用bootstrap脚本初始化home目录。

## 三、它和谁协作

- Sandbox是基类契约。
- OpenSandboxProvider创建并管理它。
- SandboxSync是远程SDK实例。
- on_terminal_failure挂provider的invalidate。

## 四、重要性评级

评级是5分。

理由如下。

这个类是OpenSandbox远程沙箱的实例包装。

锁结构处理renew和操作的竞争。

命令TTL不短于命令超时。

destroy后client不能复用的语义正确。

终端失败分类。

这些质量不错。

扣掉5分。

扣分原因是它是远程SDK包装。

逻辑直接。
