# deerflow.agents.middlewares.tool_call_metadata档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/tool_call_metadata.py。

## 一、这个中间件是干什么的

这个模块不是一个中间件类。

这个模块是共享工具函数库。

这个模块解决工具调用元数据的一致性问题。

一条AIMessage的工具调用元数据存在多个地方。

主地方是tool_calls结构化列表。

原始载荷在additional_kwargs里的tool_calls键。

content里还有provider的工具调用块。

中间件从AIMessage上删除工具调用时只改一个地方就会出问题。

留在content里的工具调用块会被provider适配器重新序列化成工具调用。

这些块没有匹配的工具结果。

Anthropic和OpenAI Responses API会在后续每次请求上拒绝这种悬空块。

这个模块提供clone_ai_message_with_tool_calls函数。

这个函数克隆AIMessage时同步修剪全部provider表面。

目录的AGENTS.md明确要求删除工具调用必须用这个函数。

不能裸更新tool_calls字段。

## 二、模块里的主要成员

### 1、clone_ai_message_with_tool_calls函数

这个函数是模块的核心。

这个函数克隆AIMessage并保留全部provider表面一致。

这个函数接收三个参数。

第一个是message原始消息。

第二个是tool_calls保留的调用列表。

第三个是content可选的内容替换。

content不传时用原消息的content。

这个函数做五件事。

第一件事设置tool_calls。

第二件事同步content里的工具调用块。

_sync_content_tool_call_blocks做同步。

第三件事同步additional_kwargs里的原始载荷。

第四件事清理function_call键。

tool_calls为空时移除function_call键。

第五件事修正finish_reason。

tool_calls为空且finish_reason是tool_calls时改成stop。

这个函数返回model_copy。

这个函数从不改动原消息。

### 2、_sync_content_tool_call_blocks函数

这个函数修剪content里的工具调用块。

保留的调用是tool_calls加invalid_tool_calls。

invalid_tool_calls里的调用块也要保留。

因为DanglingToolCallMiddleware会用占位结果回答这些调用。

按id配对的规则。

块带id时id在保留集合里就保留。

块带id时id不在保留集合里就丢弃。

无id块的配对规则。

有些provider的块不带id。

Gemini风格的function_call块可能没有id。

无id块按name按顺序配对。

无id块配对还受预算限制。

预算是保留调用里没被带id块匹配的数量。

无id块超出预算就丢弃。

这个函数没有块被丢弃时返回原content。

### 3、id键映射表

_CONTENT_TOOL_CALL_ID_KEYS是内容块类型的id键映射。

这个映射列出每种块类型携带工具调用id的键。

键按优先顺序排列。

tool_use块的id在id键里。

这是Anthropic的块。

Anthropic重新发出的tool_use块的id可能不在tool_calls里。

function_call块的id在call_id键或id键里。

这是OpenAI Responses的块。

call_id是工具调用id。

id是fc_开头的item id。

custom_tool_call块的id在call_id键里。

tool_call和tool_call_chunk块的id在id键里。

这是LangChain v1标准内容。

这些块可以转换回上面任何形状。

这个映射镜像了tool_call_args模块的内容表面。

_content_block_call_id函数按映射读块的调用id。

按优先顺序取第一个非空字符串。

_tool_call_block_id_keys函数读块类型的id键映射。

### 4、_raw_tool_call_id函数

这个函数读原始载荷条目的id。

id必须是非空字符串。

非字符串或空字符串返回None。

## 三、它和谁协作

这个模块是共享库。

这个模块本身不注册进中间件链。

这个模块被token_budget_middleware使用。

token_budget硬停止时用这个函数剥掉全部工具调用。

这个模块被todo_middleware协作的链路使用。

这个模块的规则和DanglingToolCallMiddleware互补。

DanglingToolCallMiddleware为没有结果的调用补占位结果。

这个模块保留invalid_tool_calls的调用块让占位结果能配上。

这个模块的id键映射和tool_call_args的表面定义镜像。

两个模块分别负责删除和改写两个方向。

## 重要性评级

评级是5分。

理由如下。

悬空工具调用块是一个真实的拒绝风险。

Anthropic和OpenAI Responses都会拒绝悬空块。

被拒绝的请求会让整个线程的后续请求全部失败。

AGENTS.md把这个函数定为删除工具调用的唯一正确方式。

这个函数被硬停止等关键路径使用。

不评更高分的原因是这个模块很小。

这个模块只有一个核心函数加辅助映射。

这个模块是纯辅助库。

这个模块不注册进中间件链。

只在删除工具调用的场景被用到。

所以评级是5分。
