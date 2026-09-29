# deerflow.community.aio_sandbox.aio_sandbox

## 一、这个模块是干什么的

这个模块是AIO沙箱的客户端实现。

背景是这样的。

AIO沙箱是all-in-one沙箱。

它是一个远程的沙箱服务。

跑在Docker容器或K8s Pod里。

通过HTTP API通信。

这个类实现Sandbox抽象。

它通过HTTP和沙箱服务通信。

它管什么。

管命令执行。

管文件读写。

管shell会话。

它还有会话管理的复杂逻辑。

shell会话是服务端的。

每个会话有一个服务端id。

会话创建失败分两种。

明确的失败直接报错。

不明确的失败要标记为"疑似成功"。

因为可能命令实际执行了但响应丢了。

老版本沙箱镜像不支持按命令注入环境变量。

这种情况要快速失败。

给操作员一个明确的升级提示。

而不是让模型傻傻重试。

## 二、模块里的主要成员

- AioSandbox：AIO沙箱类。继承Sandbox抽象。
- execute_command：执行shell命令。支持会话和单次执行。
- execute_command_in_scope：在作用域内执行命令。作用域内的会话串行化。
- release_command_scope：释放作用域。
- _create_shell_session、_create_bash_session：创建服务端会话。
- _rotate_and_retry_shell：会话失效时轮换重试。
- _run_bash_exec：用bash.exec API执行带环境变量的命令。
- read_file、download_file：读文件。下载有100MB上限。
- _cleanup_session_best_effort：尽力清理会话。
- _session_creation_state：会话创建的所有权状态。
- requires_container_recycle：判断容器是否需要回收。
- _ScopedShellSession：一个会话的串行化锁。
- _BASH_EXEC_UNSUPPORTED_ERROR：老镜像不支持环境注入时的操作员提示。

## 三、它和谁协作

- 它实现sandbox/sandbox的Sandbox抽象。
- 它依赖agent_sandbox SDK和HTTP通信。
- 它被community/aio_sandbox/aio_sandbox_provider.py创建和管理。
- 它依赖sandbox/remote_list_dir做远程列目录。

## 四、重要性评级

评级是7分。

理由是它是AIO模式沙箱的实际执行体。

AIO是默认的容器沙箱模式。

代理的命令和文件操作都经过它。

会话所有权和失效轮换是并发正确性的核心。

老镜像的快速失败设计防止无意义的重试。

它是容器模式的关键设施。
