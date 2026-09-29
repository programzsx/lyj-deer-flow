# AioSandbox档案

## 一、这个类是干什么的

这个类是aio_sandbox.py模块的沙箱实现。

这个类继承自deerflow.sandbox.sandbox.Sandbox抽象类。

这个类通过HTTP API连接一个运行中的AIO沙箱容器。

AIO沙箱是agent-infra/sandbox项目的Docker容器。

容器里跑着文件、shell、bash等多组HTTP API。

这个类就是那些API在DeerFlow侧的客户端封装。

这个类的职责很重。

所有沙箱工具（bash、读写文件、glob、grep）最终都落到这个类。

这个类解决的核心问题有三个。

问题一，shell并发损坏。

AIO容器的隐式持久shell被并发exec_command打会坏掉。

坏掉的标志是输出里出现ErrorObservation签名。

这个类用锁串行化请求，检测到损坏就换新会话重试。

问题二，秘密泄漏。

带env的命令需要每命令环境注入。

这个类走bash.exec API，每命令一个一次性会话。

秘密只存在于单条命令，不会持久。

问题三，会话歧义。

创建会话超时时结果未知。

这个类把歧义会话隔离并要求回收沙箱。

这个类还有一层会话隔离设计。

主调用保留传统的串行shell。

委派的子代理执行各自拿独立的服务端会话。

作用域内串行，作用域之间并发。

## 二、类的成员

persistent_shell_sessions是类属性。

True表示legacy路径复用一个持久shell会话。

shell状态（导出、cwd、函数）会跨命令保留。

构造函数接收五个参数。

id是沙箱实例的唯一标识。

base_url是沙箱API地址。

home_dir是沙箱内home目录，None则首次访问时从沙箱拉取。

request_headers是可信的控制面头。

request_headers是本地中继需要的，绝不注入沙箱命令。

default_command_timeout是provider配置的命令截止时间。

close方法尽力关闭宿主侧HTTP客户端。

SDK是Fern生成的，没有close方法。

所以close沿着属性链找到真正的httpx.Client关闭。

close是幂等、线程安全、非致命的。

close还会清理所有作用域会话、恢复会话、歧义会话。

execute_command方法执行shell命令。

无env走持久shell路径。

有env走bash.exec路径。

命令在锁内串行。

损坏检测后自动换会话重试。

execute_command_in_scope方法在子代理作用域内执行命令。

无env且带scope_id才走作用域路径。

同一作用域串行，不同作用域并发。

release_command_scope方法清理一个作用域的会话。

read_file方法读沙箱文件，支持行范围。

download_file方法下载文件字节。

download_file拒绝路径穿越。

download_file拒绝VIRTUAL_PATH_PREFIX之外的路径。

download_file限制100MB下载上限。

list_dir方法列目录内容。

list_dir用独立的60秒截止时间。

list_dir只认complete状态的列表。

write_file方法写文本文件。

update_file方法写二进制文件，用base64编码。

glob方法按模式匹配文件。

grep方法在文件里搜索。

home_dir是property，惰性获取沙箱内home目录。

requires_container_recycle是property。

True表示有进行中或歧义的会话创建，需要回收沙箱。

还有一批私有辅助方法。

会话创建、会话清理、超时计算、输出渲染、状态判断。

内部状态包括多个锁、会话注册表、恢复会话ID、损坏标志。

## 三、它和谁协作

它继承自deerflow.sandbox.sandbox.Sandbox。

父类定义了沙箱的公共接口和超时常量。

AioSandboxProvider是它的创建者和生命周期管理者。

provider在注册发现、注册新建、暖池回收三处构造它。

provider调用它的close方法释放宿主侧资源。

agent_sandbox SDK是它的底层客户端。

client.shell提供会话和命令执行。

client.bash提供每命令env的执行。

client.file提供文件读写、glob、grep。

它使用sandbox_http_trust_env决定HTTP客户端的代理行为。

它使用parse_remote_list_dir_output解析目录列表命令输出。

它使用GrepMatch、path_matches、should_ignore_path、truncate_line做搜索后处理。

_Virtual_PATH_PREFIX来自deerflow.config.paths。

_ScopedShellSession和_SessionCreationState是它的内部协作类。

## 四、重要性评级（1-10分+理由）

评级是9分。

理由如下。

这个类是AIO沙箱全部工具能力的落地层。

bash、文件读写、搜索全部经过它。

没有它，沙箱执行系统就没有远程实现。

agent的代码执行、文件操作、技能运行全部不可用。

它承载了三个并发与安全设计。

shell并发防护、秘密单命令隔离、会话歧义隔离。

provider的暖池、发现、注册机制产出的最终可用对象就是它。

它的依赖点遍布沙箱工具链。

删除它等于删除AIO沙箱的核心执行能力。

整个community/aio_sandbox子包的存在意义就靠它体现。

它是这批23个类里体量和复杂度最大的之一。

评级给9分。
