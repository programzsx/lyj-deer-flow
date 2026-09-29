# deerflow.sandbox-档案

## 一、这个包是干什么的

这个包是沙箱执行系统的核心。

智能体需要在隔离的环境里执行命令。
例如运行bash命令。
例如读写文件。
例如搜索代码。

沙箱就是那个隔离环境。
这个包定义沙箱的抽象接口。
这个包定义沙箱提供者的抽象接口。
这个包还定义了沙箱周边的全部支撑机制。

支撑机制包括几种。

- 异常体系。带结构化错误信息。
- 环境变量策略。防止平台密钥泄露给沙箱子进程。
- 身份派生。为远程沙箱生成稳定的作用域令牌。
- 获取串行化。让多个生命周期转换按key排队。
- 执行租约。协调一个沙箱的多个并发使用者。
- 远程命令包装。为远程提供者定义find和grep的输出契约。
- 路径模式。把宿主路径掩码回虚拟路径。
- 授权和安全。控制谁能用沙箱、宿主bash是否允许。
- 中间件。管理沙箱生命周期并处理网络策略审批。

## 二、包里的主要成员

### （一）模块sandbox.py——Sandbox抽象基类

`Sandbox`定义沙箱环境的标准操作。

- `execute_command`执行bash命令。支持每次调用的环境变量注入。支持每次调用的超时。环境变量用来传递请求级密钥。密钥不进提示词、不进工具参数、不进命令串。
- `read_file`读文件内容。支持行范围。
- `download_file`下载二进制内容。路径穿越时抛PermissionError。读不到时抛OSError。
- `list_dir`列目录。缺失路径抛FileNotFoundError。执行失败抛OSError。失败不能返回空列表。
- `write_file`写文件。支持追加。
- `glob`按模式找路径。返回匹配和truncated标志。truncated表示结果可能不完整。
- `grep`在文本里搜索。返回匹配和truncated标志。
- `update_file`用二进制内容更新文件。

抽象层还负责环境变量名校验。
`_validate_extra_env`拒绝非法的POSIX变量名。
这是纵深防御。
未来的实现如果把key拼进shell串，也不必重新推导校验规则。

它还有一个`persistent_shell_sessions`属性。
这个属性声明命令是否复用同一个持久shell会话。
它是三态的，默认失败关闭。
None表示实现没有声明语义。
消费者只信任显式的False。
None和True一样降级为不可验证。

### （二）模块sandbox_provider.py——SandboxProvider抽象基类

`SandboxProvider`定义沙箱提供者的标准操作。

- `acquire`获取一个沙箱并返回它的ID。
- `acquire_async`不阻塞事件循环地获取。大多数提供者的生命周期API是同步的。异步运行时应该调用这个方法，让阻塞操作在worker线程里跑。
- `get`按ID取回沙箱。
- `get_scoped`只在沙箱属于这个身份时返回它。这个钩子必须是非阻塞的内存查找。不实现身份感知查找的提供者失败关闭。
- `release`释放并销毁沙箱。
- `sync_agent_skills`把准备好的技能投影同步进沙箱。
- `reset`清除跨实例的缓存状态。
- 网络策略钩子。`sandbox_network_mode`返回出站网络模式。`consume_network_policy_events`认领待呈现的代理事件。`decide_network_policy_request`应用用户决定。

它还有三个能力声明属性。
`uses_thread_data_mounts`声明是否用线程数据挂载。
`needs_upload_permission_adjustment`声明上传权限是否要调整。
`supports_agent_skill_isolation`声明能否在提供者层强制主智能体的技能视图。

单例管理是重头。
`get_sandbox_provider`返回单例。
单例受一把锁保护。
单例可以从多个OS线程访问。
例如主事件循环。
例如飞书通道线程。
裸的先查后建会双重初始化。
构造和导入在锁外进行。
提供者回调可能是插件代码。
在不可重入的锁里调用它们会自死锁。
输了安装竞态的实例会被丢弃。
丢弃会调用shutdown。
有副作用的构造器不会泄漏孤儿线程。

`reset_sandbox_provider`清缓存。
`shutdown_sandbox_provider`做完整关停。
`set_sandbox_provider`注入测试用实例。

### （三）模块exceptions.py——异常体系

异常体系以`SandboxError`为基类。
基类携带message和details。
details会拼进字符串表示。

派生异常按错误类别分层。

- `SandboxNotFoundError`。沙箱找不到或不可用。
- `SandboxRuntimeError`。运行时不可用或配置错误。
- `SandboxCommandError`。命令执行失败。带command和exit_code。
- `SandboxFileError`。文件操作失败。带path和operation。
- `SandboxPermissionError`。文件操作权限错误。
- `SandboxFileNotFoundError`。文件或目录不存在。
- `SandboxCapacityExceededError`。提供者没有可用容量。带active、warm、reserved、replicas计数。带retry_after_seconds。带reason区分容量占用和提供者关停。调用方控制重试调度。系统不自动重试。
- `SandboxAuthorizationError`。调用者角色被拒绝沙箱执行。错误会转成友好的ToolMessage，而不是崩溃整个运行。

### （四）模块env_policy.py——环境变量策略

这个模块解决一个泄露问题。

技能脚本作为沙箱子进程运行。
子进程默认继承Gateway进程的整个os.environ。
os.environ里有平台密钥。
例如OPENAI_API_KEY。
继承让任何请求级密钥注入失去意义。

`build_sandbox_env`构造子进程环境。
它先从继承环境里剔除看起来像密钥的变量。
然后再叠加显式注入的请求级密钥。

剔除规则有两层。

- 通配模式。匹配`*KEY*`、`*SECRET*`、`*TOKEN*`、`*PASS*`、`*CREDENTIAL*`、`*DSN*`。匹配不区分大小写。
- 精确名单。例如DATABASE_URL、REDIS_URL、GH_PAT、MYSQL_PWD、PGSERVICEFILE、SSH_AUTH_SOCK。这些名字不含通配词但携带凭据。

注入的密钥即使名字命中模式也会保留。
因为注入在上游已经获得授权。
良性变量如PATH、HOME被保留。

### （五）模块identity.py——作用域令牌

`derive_sandbox_scope_token`为远程沙箱派生稳定令牌。
令牌是sha256(user_id:thread_id)的前16个十六进制字符。
这是兼容性契约。
AIO、E2B、BoxLite、Tenki、OpenSandbox都靠这个令牌定位已有容器。
改动任何属性都是破坏性迁移。
已有远程资源会找不到，会被冷启动。

函数是keyword-only的。
旧助手函数按(thread_id, user_id)位置传参，顺序相反。
keyword-only调用点消除了参数顺序错误。

`is_sandbox_scope_token`只校验令牌形状。
截断的hash不可逆。

### （六）模块acquire_serialization.py——获取串行化

`AcquireSerializer`让提供者选定的生命周期转换按key串行。

每个提供者选择保留自己碰撞语义的key。
AIO和E2B用(user_id, thread_id)。
BoxLite、Tenki、OpenSandbox用派生id。
序列化器不解释key。

锁表是有界的。
每个key一个条目。
条目带锁和引用计数。
引用归零且锁未被持有就移除条目。

异步路径有专门的设计。
阻塞的锁获取跑在专用的有界executor上。
不用默认executor，也不用事件循环。
`_AsyncAcquire`处理事件循环和worker之间的所有权交接。
被放弃的获取由worker自己释放锁。
清理不依赖取消中的事件循环执行回调。
重复取消不会中断已持有的临界区。

`hold`是同步上下文管理器。
`hold_async`是异步版。
`run_on_executor`把阻塞调用放到专用executor上。
它显式复制ContextVar。
`asyncio.to_thread`会自动复制。
裸的run_in_executor不会。
不复制会让trace id等请求级上下文在worker线程里读不到。

`close`拒绝新的持有者并释放executor。
它是幂等的。
正在执行的临界区不会被作废。

### （七）模块lease.py——执行租约

这个模块回答一个不同的问题。

提供者所有权存储回答"哪个Gateway实例可以回收远程沙箱"。
这个模块回答"一个Gateway内部哪些并发运行的智能体执行还在用这个活跃客户端"。

最后一个执行租约是唯一允许调用`SandboxProvider.release`的。

#### 1、SandboxLeaseManager类

管理器协调一个提供者的活跃使用者。
生命周期转换按(user_id, thread_id)key串行。
元数据用单独的锁保护。
无关线程不会阻塞彼此的慢提供者操作。

核心方法分几组。

- `acquire`和`acquire_async`。获取并绑定沙箱。对同一个执行所有者是幂等的。已有活跃绑定就复用。
- `reuse_or_acquire`和`reuse_or_acquire_async`。原子地恢复作用域沙箱或获取替代品。普通checkpoint id必须匹配user_id和thread_id。服务器创建的fork包装可以借用父级的活跃客户端。
- `retain`和`retain_async`。把执行附加到继承或checkpointed的沙箱id上。`release_on_last=False`用于借用者。借用者围住客户端但不请求停放。
- `release`和`release_async`。释放一个执行。只在最后一个使用者之后停放沙箱。

关键语义有几个。

绑定所有权是单调的。
普通所有者后来遇到fork恢复的视图，不能丢失自己的停放责任。
借用所有者后来做正常获取时可以升级。

陈旧绑定会被识别。
中间件可能在一个provider发现本地客户端已消失之前保留checkpointed id。
这种绑定被当作陈旧的。
后续获取会重建它而不是保留不可用的id。

取消会被排干。
提供者实现常把容器启动offload到worker线程。
取消等待者停不掉worker。
结果必须先被调和，然后才能交出序列化器。
重复取消被记住但不能传播进调和任务。

#### 2、模块级辅助

`get_sandbox_lease_manager`按提供者对象身份返回管理器。
提供者不要求可哈希。
用id()做key。
不同实例即使相等也不共享生命周期状态。

`ensure_sandbox_lease_owner`在运行时上下文里创建临时所有者id。
`sandbox_lease_owner`只读取不创建。
`sandbox_command_scope`读取子代理执行携带的shell会话作用域。

`release_sandbox_execution_lease`在外层生命周期围栏释放主智能体执行租约。
沙箱相关的上下文key是服务器所有的。
Gateway和worker会剔除调用方传入的值。

### （八）模块local/——本地提供者

#### 1、LocalSandbox类

`LocalSandbox`实现`Sandbox`接口。
每次命令都是全新的subprocess.run进程。
没有shell状态跨调用存活。
它声明`persistent_shell_sessions = False`。

它用路径映射工作。
`PathMapping`把容器路径映射到本地路径。
支持只读标志。

它把虚拟路径翻译成宿主路径。
`/mnt/user-data/{workspace,uploads,outputs}`映射到线程隔离的宿主目录。
翻译支持命令串和文件内容两种场景。

命令输出捕获是有界的。
`_BoundedPipeCapture`排干管道但只保留有界输出。
默认上限10MB。
超出会附加截断提示。
Windows和POSIX有不同的解码策略。
POSIX保持字节解码。
Windows处理locale码页、UTF-8、CRLF、裸CR。

命令超时默认600秒。
超时会终止进程。
阻塞的前台命令不会无限挂起一个回合。
Windows上按进程组终止。

它还处理MSYS路径转换。
Windows上Git Bash的参数转换排除只限安全的非根虚拟前缀。

#### 2、LocalSandboxProvider类

`LocalSandboxProvider`提供本地文件系统执行。
它为每个thread_id生成独立的`LocalSandbox`。

沙箱id格式是`local:{user_id}:{thread_id}`。
路径映射解析`/mnt/user-data/{workspace,uploads,outputs}`和`/mnt/acp-workspace`。
这与AIO的容器挂载保持一致。
无线程上下文的调用保留旧版通用单例，id为`local`。

按线程的沙箱放在LRU缓存里。
默认256条。
缓存由锁串行保护。
超出上限就淘汰最久未用的条目。
淘汰的线程下次获取会重建沙箱。
只丢失已写路径的反向解析提示。

技能挂载有精细的规则。
public技能是全局只读的。
legacy挂载只暴露给还没有按用户自定义技能的用户。
否则用户能读到列表层说不存在的文件。
custom挂载是按用户的。
必须在acquire时动态构建。
静态挂载会在init时绑定错误的用户。

`supports_agent_skill_isolation`是动态属性。
宿主bash启用时返回False。
因为宿主bash子进程可以绕过路径映射走规范路径。

自定义挂载有校验。
host_path必须是绝对路径。
container_path不能与保留前缀冲突。
宿主路径不存在时记录ERROR日志并给出可操作的指引。

### （九）其余支撑模块

#### 1、middleware.py

`SandboxMiddleware`管理沙箱生命周期。
它在智能体运行前确保沙箱就绪。
它处理网络策略审批。
自主运行、webhook、定时任务等无人值守场景自动拒绝。
子代理总是自动拒绝。
不会在没有人类响应者时展示审批卡片。

#### 2、search.py

定义忽略模式和搜索匹配。
`IGNORE_PATTERNS`列出.git、node_modules、__pycache__等忽略项。
`GrepMatch`是单条grep匹配。
`find_glob_matches`和`find_grep_matches`是共享的本地搜索实现。

#### 3、remote_list_dir.py

定义远程list_dir的find命令和stdout契约。
远程提供者用`find ... | head`在`sh -lc`下列目录。
POSIX sh没有pipefail。
管道退出码是head的。
缺find二进制看起来像空列表。
命令先检查根是否存在。
再写入自己的状态标记。
状态标记区分缺失路径和遍历失败。
head关管道杀死find的SIGPIPE是成功的截断，不是错误。

#### 4、remote_search.py

定义远程grep和glob的命令包装。
与list_dir同样的技术。
先检查根，再记录搜索命令自己的状态。
grep的0、1、SIGPIPE是正常完成。
grep的2和find的1表示不可读的树。
此时已打印的结果是不完整的。

#### 5、path_patterns.py

定义宿主到虚拟的输出路径匹配规则。
两个调用点把宿主路径改写回虚拟形式。
LocalSandbox和sandbox.tools必须对边界一致。
这个模块把规则只放一份。
历史上规则分两份曾导致漂移。

#### 6、read_file_contract.py

定义read_file和它的展示型消费者共享的文本标记。
例如`(empty)`。
例如`(start_line exceeds file length)`。
例如截断前缀。

#### 7、security.py

定义宿主bash的能力门控。
`is_host_bash_allowed`判断当前配置是否允许宿主bash。
LocalSandboxProvider不是安全沙箱边界。
宿主bash默认禁用。
禁用消息给出切换AIO或显式开启的指引。

#### 8、overwrite.py

提供Overwrite包装的通道值解包。
fork恢复的checkpoint可能把沙箱通道还包在Overwrite里。
直接读取会崩溃。
先解包再用。
包装形式重放父线程的沙箱状态。
调用方不能把它当成当前运行所有的沙箱。

#### 9、file_operation_lock.py

提供同路径文件操作的弱引用锁。
锁key是(sandbox_id, path)。
用WeakValueDictionary防止长驻进程内存泄漏。

## 三、它和谁协作

上游是智能体工具层。
sandbox/tools.py里的bash、ls、read_file、write_file等工具消费Sandbox接口。

上游还有SandboxMiddleware。
中间件通过SandboxProvider管理生命周期。

实现类在community包里。
AioSandboxProvider提供Docker隔离。
E2BSandboxProvider提供远程隔离。
BoxliteProvider和TenkiSandboxProvider提供微虚拟机隔离。

它和skills系统协作。
投影模块把技能树物化进沙箱可见的目录。
提供者通过sync_agent_skills同步投影。

它和授权系统协作。
每次沙箱工具调用先过authorize门。

它和uploads系统协作。
上传目录可能被挂载进本地沙箱。

## 四、重要性评级

评级：10分。

理由如下。

这个包是智能体执行能力的根基。
所有文件操作和命令执行都经过它。
约20个文件直接引用local子包。
sandbox包整体被大量文件引用。

它是核心路径。
没有沙箱，智能体不能执行命令、不能读写文件、不能运行技能脚本。

它承载了最多的安全语义。
环境变量策略防止密钥泄露。
授权门控制角色权限。
路径映射隔离线程数据。
租约协调并发使用者。
删除它，整个智能体执行体系瘫痪。
所有沙箱提供者失去接口来源。
所有文件工具失去实现基础。
