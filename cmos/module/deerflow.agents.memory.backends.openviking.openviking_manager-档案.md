# deerflow.agents.memory.backends.openviking.openviking_manager-档案

## 一、这个模块是干什么的

这个文件是OpenViking记忆后端的核心管理器。

管理器构建在维护中的官方LangChain适配器包上。

官方包是langchain-openviking。

这个后端是单用户的。

单用户指一个API密钥绑定一个DeerFlow所有者。

职责划分是这个后端的核心设计。

DeerFlow继续决定捕获和召回的时机。

DeerFlow决定捕获时机、召回查询和转录游标。

官方适配器包拥有传输、消息转换、批处理、提交重试和检索行为。

这个后端只在两者之间做桥接。

AGENTS.md对它有专门的约束。

约束是不允许内嵌OpenViking导入、根密钥访问或受信身份头。

异步入口必须把同步SDK和文件操作卸载到线程。

关闭必须在关闭录音客户端前排空进行中的工作。

## 二、模块里的主要成员

### 1、_load_official_integration函数

_load_official_integration加载官方集成包的类。

这个函数做延迟导入。

延迟导入指用到时才导入。

导入失败时抛出明确的ImportError。

错误信息说明需要langchain-openviking==0.1.0。

函数还检查SDK的actorpeer支持。

缺少请求级actorpeer支持时报错。

错误信息说明需要openviking-sdk>=0.1.6,<0.2。

函数返回一个字典。

字典里有五个成员。

五个成员是OpenVikingCommitPolicy、OpenVikingPartialWriteError、OpenVikingRetriever、OpenVikingSessionRecorder、use_actor_peer。

### 2、_format_documents函数

_format_documents把检索到的文档格式化成注入文本。

每个文档变成一行。

行格式是横线加方括号类别加内容。

内容被压平空白并按casefold去重。

内容超预算时截断最后一行。

截断保留剩余空间大于16字符时才追加省略号行。

### 3、_document_to_fact函数

_document_to_fact把一个文档映射成fact形状。

fact的id用OpenViking的URI。

URI来自metadata的openviking_uri或source。

confidence来自metadata的openviking_score。

### 4、OpenVikingMemoryManager类

OpenVikingMemoryManager继承MemoryManager。

OpenVikingMemoryManager是本文件的核心类。

#### （1）私有属性

类有大量私有属性。

_config保存配置。

_recorder是官方的会话录音器。

_retriever是官方的检索器。

_use_actor_peer是官方的actorpeer上下文管理器。

_partial_write_error是官方的部分写入异常类。

_lifecycle和_active_operations管理生命周期。

_session_locks是弱引用的session锁字典。

弱引用指不活跃的session锁会被自动回收。

_closed、_close_requested、_resources_closed记录关闭状态。

#### （2）model_post_init方法

model_post_init解析backend_config成OpenVikingConfig。

model_post_init加载官方集成包。

model_post_init创建OpenVikingSessionRecorder。

recorder带显式的空extra_headers。

显式空映射禁用了SDK的ovcli.conf头回退。

recorder拥有一个带恢复能力的SDK客户端。

检索器借用同一个句柄。

所以整个后端只有一个连接池和一个所有者。

recorder用mode为always的提交策略构造。

#### （3）from_config方法

from_config在mode不是middleware时抛错。

原因是这个后端只支持middleware模式。

模型主动记忆的显式工具要OpenVikingMCP。

from_config还消费宿主的should_keep_hidden_message钩子。

钩子不可调用时保存为None。

#### （4）read_failures_are_fatal_for_config方法

read_failures_are_fatal_for_config向宿主声明读取失败策略。

read_failure_policy为raise时返回True。

宿主在注入超时时保留这个策略。

#### （5）add、add_nowait、aadd方法

三个写入入口都落到_write_conversation。

add_nowait没有单独的模式。

原因是这个后端对每次接受的捕获都提交。

AGENTS.md说明这保留了DeerFlow既有的压缩前行为。

aadd用asyncio.to_thread卸载。

#### （6）_write_conversation方法

_write_conversation是写入的核心流程。

第一步要求thread_id必须存在。

thread_id缺失时抛ValueError。

第二步解析peer作用域。

第三步用owner、peer、thread推导session_id。

第四步拿session锁。

第五步在锁内调用_capture_locked。

整个流程被_begin_operation和_end_operation包住。

生命周期管理指关闭后排队的写入会被忽略并记录警告。

#### （7）_capture_locked方法

_capture_locked是捕获的核心逻辑。

这个方法管理一个转录游标。

游标持久化在storage_path下的JSON文件里。

游标记录已提交消息的哈希签名。

游标不保留消息内容。

这个方法先加载游标。

然后把每条消息变成签名。

签名是消息稳定语义的SHA256哈希。

然后处理待提交的commit。

上次有commit_pending时先调用recorder.flush重试提交。

重试失败时保留游标不前进。

然后计算已提交前缀。

 Matching用_matching_prefix_count。

前缀匹配成功时只提交增量。

前缀不匹配时退回用已提交签名集合做逐条比对。

写入用recorder.record。

遇到部分写入异常时特殊处理。

部分写入异常带input_messages_consumed和commit_pending。

已确认的部分会推进游标。

这样已确认的进度被保留，不会重复发送。

全部写入完成后保存推进后的游标。

#### （8）get_context方法

get_context是Tier1读取方法。

get_context被生命周期闸门包住。

get_context解析读取作用域。

检索器被浅拷贝后设置target_uri。

target_uri指向用户记忆根和peer记忆根。

有thread_id时切换成search模式。

search模式限定在该thread的session内。

无thread_id时用默认的find模式。

检索在actorpeer作用域内执行。

注入查询是配置的injection_query。

读取失败按策略处理。

raise策略时抛MemoryReadError。

fail_open策略时记录警告并返回空串。

结果用_format_documents格式化。

#### （9）search方法

search是Tier2方法。

空查询或生命周期关闭时返回空列表。

search用find模式，不限定session。

top_k被夹在1到100之间。

category存在时设置filter。

结果用_document_to_fact映射。

#### （10）warm方法

warm是启动预热。

warm调用SDK客户端的health检查。

fail_fast策略时不健康就抛MemoryManagerError。

warn策略时不健康就记录警告并以降级模式运行。

#### （11）shutdown_flush和close方法

shutdown_flush先停止新工作。

然后在时限内等活跃操作排空。

排空通过Condition等待完成。

超时返回False。

排空后关闭资源并返回True。

close请求幂等关闭。

活跃操作数归零时立即关闭。

否则最后一个结束的操作会触发关闭。

这个机制保证排空优先于关闭资源。

#### （12）_resolve_scope和_resolve_read_scope方法

_resolve_scope校验用户身份。

解析出的用户不等于owner_user_id时抛MemoryManagerError。

报错说明拒绝在多个用户间共享一个凭据。

这是这个后端最重要的安全约束。

然后从agent_name解析peer_id。

agent_name为None时用default_peer_id。

_resolve_read_scope包装_resolve_scope。

raise策略时把错误包成MemoryReadError。

#### （13）游标持久化方法

_state_path计算游标文件路径。

路径在storage_path下的openviking/sessions/目录。

文件名是session_id加.json。

_load_cursor读游标文件。

文件损坏或不是字典时抛MemoryManagerError。

报错说明拒绝不安全的重放。

_save_cursor写游标文件。

写入用临时文件加os.replace原子替换。

临时文件名带进程号和线程号。

## 三、它和谁协作

它依赖同目录config.py里的OpenVikingConfig。

它依赖同目录session.py里的游标和身份helper。

它实现memory/manager.py里的MemoryManager抽象契约。

它被manager.py的get_memory_manager工厂发现和构造。

它被memory中间件通过add写入。

它被prompt组装通过get_context读取。

它被memory_search工具通过search调用。

它对话外部的langchain-openviking官方包。

官方包再对话OpenViking服务器。

## 四、重要性评级

评级是8分。

理由是这个文件是四个备选后端里最复杂的实现。

转录游标和部分写入恢复在这里。

一个密钥绑定一个所有者的安全约束在这里。

生命周期排空机制在这里。

删掉它，OpenViking支持就完全消失。

不评10分的原因是OpenViking只是备选后端。

默认后端是deermem。

这个模块不参与默认路径。
