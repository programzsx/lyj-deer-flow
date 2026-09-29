# deerflow.agents.memory.manager-档案

## 一、这个模块是干什么的

这个文件是记忆系统的核心契约文件。

这个文件定义了MemoryManager接口。

MemoryManager是所有记忆后端必须遵守的统一契约。

这个文件还定义了单例工厂get_memory_manager。

工厂负责创建和缓存唯一的记忆管理器实例。

这个文件还定义了后端发现机制。

后端发现机制自动扫描backends目录下的所有记忆后端。

这个文件的设计目标是可插拔。

更换记忆后端只需要放一个backends文件夹和改一行配置。

deer-flow其他代码不需要任何改动。

这个文件还定义了四个公共错误类型。

错误类型用于在MemoryManager边界上统一报告故障。

这个文件还负责记忆判官的构建和热更新。

判官是记忆提取的成本闸门。

## 二、模块里的主要成员

### 1、MemoryManager类

MemoryManager是抽象基类。

MemoryManager继承自pydantic的BaseModel。

用BaseModel而不是裸ABC是有意为之。

BaseModel带来字段校验和序列化能力。

BaseModel还能和后端配置共享pydantic v2类型系统。

pydantic的ModelMetaclass派生自ABCMeta。

所以未实现抽象方法的子类在实例化时直接报TypeError。

记忆是持久状态。

缺少add或get_context的后端是严重缺陷。

这个缺陷在构造时就该被发现。

记忆按agent_name和user_id分桶。

thread_id对应deer-flow的会话线程。

契约刻意保持中立。

第三方记忆系统不需要改deer-flow代码就能接入。

#### （1）三个模型字段

backend_config是后端私有配置。

工厂把它原样传给后端。

None会被强制转成空字典。

零配置的Backend(backend_config=None)因此保持合法。

mode是运行模式。

mode的取值是middleware或tool。

mode镜像宿主的MemoryConfig.mode。

callbacks是可选的观测回调。

callbacks是MemoryCallbacks实例。

#### （2）两个ClassVar标志

supports_search声明后端是否支持search。

supports_search默认是False。

新后端必须显式选择加入tool模式。

requires_passive_writes_in_tool_mode声明后端在tool模式下是否仍需中间件写入。

多数后端在tool模式下完全由模型驱动持久化。

#### （3）_check_invariants校验器

校验器检查两个跨字段不变量。

第一个不变量是supports_search标志必须和search()是否被重写一致。

声明标志和实际实现不能漂移。

漂移是缺陷。

缺陷在实例化时被抓住。

第二个不变量是tool模式要求后端实现search。

tool模式下模型会调用memory_search工具。

不支持search的后端配tool模式是配置错误。

配置错误要快速失败。

#### （4）读取失败策略

read_failures_are_fatal_for_config是类方法。

这个方法只看内存配置。

这个方法不做任何输入输出。

这个方法检查failure_policy.read是否等于fail_closed。

read_failures_are_fatal属性基于它实现。

这个属性告诉调用方超时该中止还是该降级。

### 2、三层方法设计

MemoryManager的方法分成三层。

分层让后端只实现自己支持的操作。

#### （1）第一层抽象方法

第一层是add和get_context。

这两个方法是@abstractmethod。

每个后端必须实现。

add负责排队一段对话做记忆更新。

add接收原始对话消息。

消息过滤是实现的私事。

get_context返回注入就绪的记忆文本。

返回格式是实现自己的选择。

格式不属于契约。

#### （2）第二层管理操作

第二层方法带默认实现。

默认实现多数抛NotImplementedError。

add_nowait默认委托给add。

add_nowait用于紧急刷新。

摘要即将删除消息之前调用add_nowait。

这样内容被捕获而不是丢失。

search按查询搜索桶内的记忆事实。

category过滤发生在top_k切片之前。

category范围内的搜索不会被其他类别的高排名事实挤掉。

get_memory返回完整记忆文档。

clear_memory清空桶内记忆。

agent_name为None表示清空用户全部记忆。

显式agent名只清空该agent的记忆。

显式agent名必须保留用户级共享摘要。

cancel_by_agent取消某个范围内的待处理提取工作。

DeerMem丢弃匹配的待处理上下文。

这样被删除或清空的agent不会被迟到的定时器复活。

cancel_by_agent的范围规则有三个。

user_id为None只选无用户的遗留根。

user_id为None绝不表示进程内所有用户。

agent_name为None取消该用户范围内所有agent桶。

显式agent_name只取消该agent的待处理上下文。

这个方法没有取消整个进程队列的形式。

需要更大范围清扫的调用方必须自己遍历已知的用户范围。

shutdown_flush在优雅停机时做有界排空。

排空运行在Gateway停机路径上。

停机路径先停IM渠道和调度器。

所以排空期间没有新的更新到达。

没有这个方法，重启或滚动部署会丢失缓冲区里的更新。

缓冲区是纯内存的。

防抖工作线程是守护线程。

进程退出时守护线程被杀。

shutdown_flush必须遵守硬超时。

排空会做一次同步LLM调用。

同步LLM调用不能被中断。

调用方需要真实的上界。

上界要对齐K8s的terminationGracePeriodSeconds。

排空必须在pod宽限窗口内完成。

否则K8s发SIGKILL打断排空。

排空要修复的丢失会被悄悄重新引入。

返回True表示排空真实完成。

返回False表示超时或失败。

#### （3）第三层可选钩子

第三层是可选钩子。

warm预热后端资源。

warm的用途是提前加热后端资源。

warm返回三态。

True表示预热成功。

False表示预热尝试失败。

None表示后端没有需要预热的东西。

三态让宿主准确记录日志。

非DeerMem后端不会声称拥有它从未碰过的tiktoken缓存。

reload_memory丢弃缓存的记忆文档并重新加载。

create_fact手动添加一条事实。

create_fact返回记忆数据和fact_id。

fact_id为None表示容量策略淘汰了刚加的事实。

delete_fact和update_fact按id操作单条事实。

on_pre_compress、on_turn_start是给未来场景的签名。

refresh_judge在判官配置热更新后替换注入的判官。

close在优雅停机时释放后端资源。

#### （4）异步占位方法

aadd、aget_context、asearch是异步占位。

默认实现委托给同步方法。

异步默认实现没有并发收益。

真实的LLM调用仍然是同步的。

当前调用方使用同步路径。

占位让未来的异步LLM客户端不用改契约就能重写。

#### （5）from_config构造方法

from_config是抽象类方法。

from_config从后端配置和宿主钩子构建完整实例。

工厂调用它而不是直接构造类。

每个后端拥有自己的组装逻辑。

组装逻辑包括解析配置、接线依赖、消费需要的宿主钩子。

新增后端只需要实现from_config。

工厂保持不变。

host_hooks携带宿主提供的可调用对象和值。

不需要钩子的后端忽略它们。

### 3、四个错误类型

MemoryManagerError是后端中立的基类错误。

MemoryManagerError继承RuntimeError。

MemoryReadError表示必需的记忆读取失败。

调用方不能在缺少记忆的情况下继续。

MemoryConflictError表示写入在乐观并发竞争中落败。

MemoryCorruptionError表示持久化记忆无法安全读取。

AGENTS.md要求用这些类型化冲突类。

不要用异常文本匹配。

Gateway把冲突映射为HTTP409。

Gateway把存储损坏映射为稳定的HTTP500。

### 4、MemoryCallbacks类

MemoryCallbacks是记忆后端的观测钩子。

默认实现是空操作。

子类只重写需要的钩子。

on_memory_llm_call在LLM调用之前修改invoke_config。

追踪器在LLM边界发出span。

on_memory_llm_result在LLM调用之后转发结果。

成功和失败都会被调用。

这个回调让可出售的DeerMem后端独立于deer-flow的扩展API。

### 5、后端发现机制

#### （1）_scan_backends函数

_scan_backends扫描backends目录。

每个暴露MANAGER_CLASS属性的子包被注册。

MANAGER_CLASS必须是MemoryManager子类。

文件夹名等于后端名等于manager_class配置值。

这是即插即用契约。

扫描结果按进程缓存。

导入失败的后端被记录日志并跳过。

损坏的可选后端不会弄坏工厂。

以下划线或点开头的目录被跳过。

#### （2）_resolve_manager_class函数

_resolve_manager_class把配置值解析成具体类。

解析顺序有两步。

第一步查注册的短名。

第二步当点分导入路径处理。

点分路径支持pkg.mod:Cls和pkg.mod.Cls两种形式。

两种形式都解析失败就抛ValueError。

绝不静默回退到别的存储后端。

记忆是持久状态。

静默替换是静默的数据完整性陷阱。

管理器在启动时急切解析。

急切解析让操作员当场修复配置。

allow_discovery参数控制是否允许扫描和导入。

超时准备阶段只允许查看已加载的后端。

冷注册表和点分导入不能变成事件循环里的文件导入操作。

#### （3）memory_read_failures_are_fatal函数

这个函数不构造新管理器就解析严格读取能力。

resolved_only为True时绝不扫描导入。

类未加载就返回None。

调用方可以在自己的有界工作线程里完成发现。

无效配置和完整解析失败都按致命处理。

#### （4）backend_requires_passive_writes_in_tool_mode函数

这个函数返回后端在tool模式下是否需要中间件写入。

解析类时不构造实例。

这样agent组装不运行后端启动检查。

agent组装也不做网络输入输出。

### 6、宿主默认钩子提供者

宿主钩子是后端可能消费的槽位的宿主默认值。

工厂是钩子提供者。

每个后端的from_config是消费者。

消费者决定用哪些钩子。

新增后端不需要改工厂。

backends/deermem之外的宿主代码在这里提供钩子。

可移植的后端包不命名deer-flow概念。

#### （1）LangfuseMemoryCallbacks类

LangfuseMemoryCallbacks是宿主默认回调。

它在记忆LLM边界发射langfuse span。

on_memory_llm_call把langfuse追踪元数据合并进invoke_config。

langfuse不是启用的追踪提供者时是空操作。

on_memory_llm_result转发DeerMem提供者结果。

转发使用构造时捕获的扩展快照。

没有系统模型观察者时直接返回。

桥接自身的失败是非致命的。

桥接失败只记录警告。

拆卸信号必须传播。

#### （2）三个宿主默认函数

_host_default_should_keep_hidden_message判断隐藏消息是否保留。

只有携带人工输入澄清回应的hide_from_ui消息保留。

用户的澄清因此被捕获进记忆。

其他隐藏消息全部丢弃。

框架内部提醒和view_image载荷都被丢弃。

_host_default_llm构建宿主默认聊天模型用于零配置提取。

create_chat_model(name=None)返回应用默认模型。

attach_tracing为True让记忆LLM调用出现在langfuse。

没有可用模型时返回None。

返回None让DeerMem以清晰错误停用提取。

而不是在启动时崩溃。

_host_default_extraction_callback记录提取后指标。

指标包括令牌用量、通过置信度过滤的事实数、被拒事实数。

拒绝率超过60%时发警告。

提示词或阈值回归因此可见。

不需要逐条检查追踪。

scope门指标单独记录。

scope门拒绝率超过60%同样发警告。

prescreen记录和signal分类记录也在这里输出。

prescreen记录是跳过留下的唯一痕迹。

跳过不运行LLM调用。

记录携带摘要标识和回退原因。

#### （3）_collect_host_hooks函数

_collect_host_hooks返回钩子字典。

callbacks是LangfuseMemoryCallbacks实例。

should_keep_hidden_message是隐藏消息过滤函数。

trace_context_manager是ensure_trace_context。

host_llm_factory是工厂可调用对象。

host_llm_factory而不是实例。

后端只在真正需要时才构建宿主默认模型。

每次启动构建用不上的默认模型浪费时间。

extraction_callback是提取后回调。

judge是宿主记忆配置构建的判官。

两侧都关闭时judge为None。

None让提取路径和没有该功能的部署完全一致。

配置了但不可用的判官在agent构建时失败。

判官能决定调用是否发生。

半配置的判官不能运行。

### 7、单例工厂和判官热更新

#### （1）get_memory_manager函数

get_memory_manager返回单例MemoryManager。

无锁快速路径先检查实例。

实例存在时刷新判官然后返回。

实例不存在时进入_manager_lock。

锁内再次检查。

这是双重检查锁定。

deer-flow是多线程的。

记忆注入经asyncio.to_thread运行。

更新队列在Timer线程上触发。

Gateway和agent线程都到达这里。

双重检查锁定保证只有一个实例被构建。

后端拥有有状态的依赖。

DeerMem拥有存储、队列、更新器。

其他后端可能打开连接。

工厂解析storage_path。

没有配置storage_path时默认用runtime_home。

绝对路径直接使用。

相对路径相对runtime_home解析。

相对路径如果保持原样会相对CWD。

相对CWD是脆弱的。

工厂调用cls.from_config构建实例。

mode镜像宿主MemoryConfig.mode。

mode让不变量校验器在工厂路径上也能触发。

最后记录判官配置签名。

#### （2）判官签名和热更新

_judging_config_signature生成宿主判官配置的稳定签名。

签名覆盖两个槽位的完整内容。

签名覆盖共享的顶层typesafe块。

签名覆盖每个启用侧的已解析连接身份。

一个侧不覆盖连接字段时从共享块继承。

编辑共享块必须使缓存的判官失效。

已解析身份还能抓住通过环境变量轮换的凭据。

配置文本本身不显示这种轮换。

已解析身份记录凭据指纹。

已解析身份绝不记录密钥本身。

Effective连接身份用resolve_connection_for_mode解析。

解析顺序是槽位覆盖、共享块、内置默认、环境凭据。

解析失败的侧标记为unresolved。

标记unresolved而不抛异常。

这样签名永远不会弄坏get_memory_manager。

随后的重建会暴露同样的错误。

_refresh_judge_for_reloaded_config重建判官。

签名没变就直接返回。

重建失败时保留上一个可用判官。

失败也记录签名。

记录签名避免每次调用重试重建。

发布在管理器锁下进行。

发布前重新验证配置代次。

另一个线程可能在重建期间回滚配置。

回滚后安装旧判官会让已被取代的模式复活。

代次变了就丢弃这次构建。

下次查找会按当前配置重建。

#### （3）reset_memory_manager函数

reset_memory_manager清除缓存的单例和后端注册表。

清除判官签名。

下次调用重新读配置、重新扫描后端。

测试和运行时切换后端使用它。

### 8、context_query_kwargs函数

这个函数决定是否传递query关键字。

后端接受query关键字时才传。

用inspect.signature检查参数。

有VAR_KEYWORD参数时传。

有名为query的位置或关键字参数时传。

query为None时不传。

不可检查的可调用对象保持旧调用契约。

后端的TypeError绝不触发重试。

老插件因此不需要改签名。

## 三、它和谁协作

### 1、它依赖谁

它依赖deerflow.config.memory_config的get_memory_config。

get_memory_config提供manager_class、mode、backend_config和判官配置。

它依赖deerflow.config.runtime_paths的runtime_home解析默认存储路径。

它懒加载deerflow.tracing的inject_langfuse_metadata做langfuse注入。

它懒加载deerflow.extensions获取已加载扩展。

它懒加载deerflow.models的create_chat_model构建默认提取模型。

它懒加载deerflow.agents.human_input的read_human_input_response。

它懒加载deerflow.trace_context的ensure_trace_context绑定追踪上下文。

它懒加载deerflow.typesafe.connection解析判官连接身份。

它懒加载deerflow.agents.memory.signals.coordinator的build_memory_judge构建判官。

懒导入让模块保持廉价导入。

### 2、谁调用它

__init__.py把它导出为包的公共API。

summarization_hook.py调用get_memory_manager和add_nowait。

tools.py的四个记忆工具都调用get_memory_manager。

memory_middleware调用add和get_context。

Gateway的记忆路由调用get_memory、clear_memory、import_memory。

Gateway停机路径调用shutdown_flush和close。

Gateway启动路径调用warm。

DynamicContextMiddleware调用get_context和aget_context。

memory_read_failures_are_fatal被超时处理路径调用。

## 四、重要性评级

评级是10分。

理由是这个文件是整个记忆系统的根契约。

所有后端实现都遵守这里定义的接口。

单例工厂是所有记忆读写的唯一入口。

后端发现机制决定了可插拔架构的成立。

四个错误类型是跨层错误处理的统一词汇。

双重检查锁定、配置签名、判官热更新这些并发和一致性逻辑都集中在这里。

解析失败绝不静默回退的设计保护了数据完整性。

删掉它，记忆系统没有统一契约，全部调用方失去入口。

不评满分以外分数的理由是它本身就是系统赖以运转的根，无可替代。
