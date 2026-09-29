# deerflow.agents.memory.tools-档案

## 一、这个模块是干什么的

这个文件是工具驱动记忆模式的工具集。

它向模型暴露四个LangChain工具。

四个工具是memory_search、memory_add、memory_update、memory_delete。

模型可以直接调用这些工具。

模型自己决定什么时候搜索记忆。

模型自己决定什么时候修改事实。

memory.mode等于tool时这些工具被注册到agent上。

多数后端在tool模式下不装MemoryMiddleware。

持久化由模型驱动。

个别后端设置requires_passive_writes_in_tool_mode。

这些后端保留对话写入。

同时用工具提供查询感知的召回。

这个文件是后端中立的。

每个工具都经过MemoryManager抽象基类。

每个工具都通过get_memory_manager拿单例。

所以tool模式对任何实现了相关操作的后端都能工作。

## 二、模块里的主要成员

### 1、_resolve_scope函数

这个函数解析工具处理器的范围。

范围是agent_name和user_id。

返回值是元组。

元组第一项是agent_name。

元组第二项是user_id。

#### （1）解析逻辑

工具执行通过LangGraph runtime上下文收到用户和agent元数据。

函数优先使用这个通道。

函数用getattr(runtime, "context", None)取上下文。

上下文是字典且包含agent_name时取出它。

agent_name转成字符串。

没有agent_name时agent_name保持None。

None表示全局记忆桶。

user_id交给resolve_runtime_user_id解析。

#### （2）设计理由

优先用runtime上下文而不是ContextVar回退。

理由是持久化要跨请求和任务边界保持正确的范围。

ContextVar在边界跨越时不可靠。

runtime上下文是显式传递的。

显式传递更可靠。

### 2、_memory_content_key函数

这个函数生成内容的去重键。

函数做两步处理。

第一步是strip去首尾空白。

第二步是casefold转小写。

casefold比lower更彻底。

这个键用于memory_add的重复内容检查。

### 3、memory_search_tool工具

memory_search用自然语言查询搜索已有事实。

模型用它检查自己对用户已经知道什么。

已知内容包括偏好、过去的纠正、上下文、存储的事实。

#### （1）参数

query是自然语言查询。

查询按大小写不敏感的子串匹配。

category是可选的类别过滤。

类别例子有preference、correction、context。

只有类别完全相等的事实被返回。

limit是最大返回数。

默认是10。

#### （2）返回值

返回JSON字符串。

JSON包含results和count两个键。

results是事实对象列表。

每条事实有id、content、category、confidence、createdAt、source。

#### （3）错误处理

任何异常被捕获。

异常记录日志。

返回JSON的error键。

工具绝不抛异常给模型。

### 4、memory_add_tool工具

memory_add存储关于用户或对话上下文的新事实。

事实跨会话持久。

事实可以通过memory_search访问。

事实也可以通过自动上下文注入访问。

#### （1）参数

content是要记住的事实文本。

category是类别标签。

category默认是context。

confidence是确定程度。

confidence取值0.0到1.0。

默认是0.7。

用户明确陈述用高值。

推断内容用低值。

#### （2）写入流程

流程有多步。

第一步是strip内容。

空白内容直接返回empty content错误。

第二步是生成content_key。

第三步是调用get_memory拿现有事实列表。

第四步是快速路径重复检查。

现有事实里有内容和content_key相同的就直接拒绝。

返回duplicate错误。

快速路径避免了常见的写尝试浪费。

权威检查在后端的create临界区里。

DeerMem在每次修订冲突重试时对新鲜快照重新检查。

所以同一用户的并发工具调用不会都写入相同内容。

第五步是调用manager.create_fact。

create_fact返回记忆数据和fact_id。

直接用返回的id。

不用内容重新推导id。

重新推导会让工具耦合到后端的归一化逻辑。

重新推导还会误报存储上限。

#### （3）三种失败情况

NotImplementedError被单独捕获。

捕获后返回后端不支持create_fact的错误。

这是tier-3默认抛出的。

不支持fact CRUD的后端走这条路径。

noop后端就是这样。

fact_id为None表示容量策略淘汰了新事实。

返回明确的容量淘汰错误。

不返回悬空的id。

ValueError被捕获后返回错误文本。

其他异常记录日志后返回error。

#### （4）不使用提取门

工具模式的CRUD不经过提取安全门。

提取门包括scope、durability、authority标签检查。

提取门保护的是自动中间件写入。

工具模式是显式CRUD。

模型主动选择写入。

两条路径的保护策略不同。

### 5、memory_update_tool工具

memory_update更新已有事实。

只有提供的字段被修改。

省略的字段保持原样。

模型用它修正过时或错误的事实。

#### （1）参数

fact_id是必需的。

fact_id来自memory_search的结果。

content、category、confidence都是可选。

不传的字段不变。

#### （2）流程和错误

调用manager.update_fact。

NotImplementedError被捕获后返回不支持错误。

KeyError被捕获后返回fact not found错误。

ValueError被捕获后返回错误文本。

其他异常记录日志后返回error。

成功返回fact_id和status updated。

### 6、memory_delete_tool工具

memory_delete按id删除事实。

模型用它删除不再准确或不再相关的事实。

#### （1）参数和流程

fact_id是必需的。

fact_id来自memory_search的结果。

调用manager.delete_fact。

NotImplementedError被捕获后返回不支持错误。

KeyError被捕获后返回fact not found错误。

ValueError被捕获后返回错误文本。

其他异常记录日志后返回error。

成功返回fact_id和status deleted。

### 7、get_memory_tools函数

get_memory_tools返回全部四个工具的列表。

agent工厂调用它。

调用时机是memory.mode等于tool。

返回的列表直接注册到agent的工具集上。

### 8、错误处理的统一模式

四个工具共用同一种错误处理哲学。

工具永远返回JSON。

工具绝不向模型抛异常。

异常抛给模型会破坏对话流。

NotImplementedError单独捕获。

捕获后报告具体是哪个操作不被支持。

KeyError单独捕获。

捕获后报告事实未找到。

ValueError单独捕获。

捕获后透传错误文本。

其他异常记录完整日志。

日志记录logger.exception。

返回值只带错误字符串。

错误响应带error键。

成功响应带status或results键。

## 三、它和谁协作

### 1、它依赖谁

它依赖deerflow.agents.memory的get_memory_manager。

四个工具都通过它拿单例后端。

它依赖deerflow.runtime.user_context的resolve_runtime_user_id。

它依赖deerflow.tools.types的Runtime类型。

它依赖langchain的tool装饰器。

tool装饰器把函数注册为LangChain工具。

parse_docstring为True表示从docstring解析工具描述和参数说明。

### 2、谁调用它

agent工厂调用get_memory_tools。

调用条件是memory.mode等于tool。

模型在对话中调用这四个工具。

工具的docstring就是模型看到的说明。

docstring引导模型什么时候用memory_search。

docstring引导模型先search拿fact_id再update或delete。

### 3、它经过的MemoryManager方法

memory_search走manager.search。

search是tier-2方法。

memory_add走manager.create_fact。

create_fact是tier-3钩子。

memory_update走manager.update_fact。

update_fact是tier-3钩子。

memory_delete走manager.delete_fact。

delete_fact是tier-3钩子。

tier-3的默认实现是抛NotImplementedError。

工具捕获这个异常并返回JSON错误。

所以任何后端都能配tool模式。

支持fact CRUD的后端得到完整功能。

不支持的后端得到清晰的错误信息。

noop后端继承默认抛出。

调用这些工具返回错误。

### 4、和中间件模式的关系

memory.mode有middleware和tool两种。

middleware模式是被动捕获。

MemoryMiddleware自动排队消息。

tool模式是模型驱动。

模型主动搜索和修改。

tool模式在支持的远程后端上仍然使用MemoryMiddleware做被动写入。

requires_passive_writes_in_tool_mode标志控制这一点。

AGENTS.md说明tool模式的注入只包含共享摘要。

tool模式把agent事实留在memory_search后面。

模型需要主动搜索才能看到agent事实。

## 四、重要性评级

评级是7分。

理由是这个文件是tool模式的全部用户接口。

模型对记忆的一切主动操作都经过这四个工具。

范围解析保证了持久化跨边界归属正确。

重复内容的快速路径检查减少了无效写。

权威检查留给后端临界区的设计避免了并发重复写入。

统一的错误处理模式让工具永远不会破坏对话流。

tier-3默认抛出加工具捕获的设计让tool模式对任意后端可用。

不评更高分的原因是它只是Manager契约的薄封装。

核心的存储、检索、并发控制都在后端实现里。

middleware模式下这个文件完全不被使用。
