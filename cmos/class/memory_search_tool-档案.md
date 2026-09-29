# memory_search_tool-档案

## 一、这个类是干什么的

memory_search_tool不是类。

它是agents/memory/tools.py里的LangChain @tool函数。

tools.py为tool驱动的内存模式暴露工具。

memory_search、memory_add、memory_update、memory_delete。

模型可以直接调用。

memory.mode为tool时这些工具注册在agent上。

大多数后端省略MemoryMiddleware。模型驱动持久化。

设置requires_passive_writes_in_tool_mode的后端保留会话写。

工具提供query感知recall。

后端无关。

每个工具走MemoryManager ABC。

search和get_memory是tier-2方法。

create_fact等是tier-3钩子。默认raise NotImplementedError。

不支持时工具抓住并返回JSON error。不崩。

这个模块位于backend/packages/harness/deerflow/agents/memory/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_resolve_scope辅助函数

它解析tool handler作用域的agent_name和user_id。

工具执行通过LangGraph runtime context接收user和agent元数据。

优先那个通道。不是ContextVar回退。

持久化跨request和task边界保持正确作用域。

### 2、memory_search_tool

按自然语言query搜索已有facts。

大小写不敏感子串匹配。

category可选过滤。

返回JSON。results加count。

每个fact有id、content、category、confidence、createdAt、source。

失败时返回JSON error。

### 3、memory_add_tool

存储关于用户或会话上下文的新fact。

先规整content。空的返回error。

快速路径重复拒绝。

省掉常见情况的写入尝试。

权威检查在后端的create临界区。

DeerMem在每次revision冲突重试时对照新快照重查。

同一用户的并发工具调用不能都存相同内容。

create_fact返回(memory_data, fact_id)。

直接用id。不用内容匹配再推导。

内容匹配会把工具耦合到后端的内容规整。

可能误报存储cap。

不支持的后端抛NotImplementedError。转成JSON error。

fact_id为None时报告capacity结果。

max_facts策略淘汰了新fact。

不返回悬空id。

### 4、memory_update_tool和memory_delete_tool

memory_update更新已有fact。

只改提供的字段。省略的字段保持原样。

先memory_search找fact_id再更新。

memory_delete按id删除fact。

两者不支持的后端返回JSON error。

KeyError时返回fact not found。

### 5、tool mode的差异

tool mode暴露显式CRUD。

不是被动staleness-review路径。

staleness的age、category、removal-count guardrail保护自动middleware清理。

tool mode操作员选择模型驱动的更新和删除。

文档说明这个差异供配置审查。

## 三、它和谁协作

- get_memory_manager返回单例后端。
- Runtime是LangGraph runtime上下文。
- resolve_runtime_user_id解析用户。
- DeerMem后端的fact CRUD实现。

## 四、重要性评级

评级是6分。

理由如下。

这个模块是tool模式的内存CRUD入口。

四个工具都后端无关。

快速路径重复拒绝加后端权威检查双层。

create_fact直接用返回的fact_id。

能力不支持时优雅降级成JSON error。

作用域解析优先runtime context。

这些质量不错。

扣掉4分。

扣分原因是它只在tool mode使用。
