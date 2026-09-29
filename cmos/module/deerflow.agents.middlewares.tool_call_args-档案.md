# deerflow.agents.middlewares.tool_call_args档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/tool_call_args.py。

## 一、这个中间件是干什么的

这个模块不是一个中间件类。

这个模块是共享工具函数库。

这个模块解决的问题很小但是很致命。

一条LangChain的AIMessage在最多四个地方携带工具调用参数。

四个地方是tool_calls结构化列表、additional_kwargs里的原始provider载荷、content里的内容块、tool_call_chunks。

不同的provider适配器读不同的地方。

有的适配器优先读结构化列表。

有的适配器回退读原始载荷。

有的适配器读content里的tool_use块。

中间件要缩小或替换历史工具调用的参数时只改一个地方就会出问题。

剩下的地方还留着原始载荷。

严格的provider会收到自相矛盾的请求。

这个模块提供统一的改写函数。

改写函数一次性改写全部四个地方。

这个模块不改写图状态。

这个模块只在模型绑定的请求副本上改写。

## 二、模块里的主要成员

### 1、rewrite_messages_tool_call_args函数

这个函数是面向消息列表的入口。

这个函数对列表里每条AIMessage的工具调用应用替换函数。

替换函数由调用方提供。

替换函数决定哪些调用被替换、替换成什么。

策略留在调用方。

这个函数返回新列表。

没有任何替换时返回None。

没有改动的消息按原身份透传。

一旦有改动所有AIMessage都丢掉resp_响应id。

丢掉resp_ id的原因见下面第5节。

只有非空字符串id且在消息内唯一的调用才提供给替换函数。

所有改写按id寻址。

畸形provider载荷在一条消息里重复的id没法只改一次。

改了会影响全部出现位置。

保守起见这样的调用完全不改。

### 2、pair_tool_call_results函数

这个函数把工具调用和结果配对。

这个函数返回ToolCallOccurrence列表。

每个ToolCallOccurrence是一条AIMessage上的一个工具调用。

配对还带上回答它的ToolMessage。

没有结果的调用result是None。

配对规则很严格。

ToolMessage只回答最近一条前置AIMessage的开放调用。

ToolMessage永远不回答更早回合的调用。

这个规则和DanglingToolCallMiddleware一致。

id跨回合重复时按出现位置配对。

被打断的调用id被后面回合复用时保持未回答。

杂散或重复的结果被忽略。

index是AIMessage在消息列表里的位置。

调用方用index跨回合排序事件。

同一条AIMessage的多个调用共享同一个index。

因为这些调用是并发执行的。

### 3、ToolCallOccurrence数据类

ToolCallOccurrence是一个冻结的dataclass。

这个类有四个字段。

index是AIMessage的位置。

message是AIMessage本身。

tool_call是调用字典。

result是回答的ToolMessage或None。

这个类提供call_id、name、args三个属性。

属性做了类型防御。

name非字符串时返回空字符串。

args非字典时返回空字典。

### 4、rewrite_tool_call_args函数

这个函数是单条消息的改写核心。

这个函数按id改写全部四个地方。

第一个地方是tool_calls结构化列表。

匹配的调用args换成新参数。

第二个地方是tool_call_chunks。

匹配的chunk args序列化成JSON字符串。

第三个地方是additional_kwargs里的原始provider载荷。

原始载荷是OpenAI的function.arguments JSON字符串。

改写支持三种形态。

function字典里的arguments。

扁平的arguments字符串。

扁平的args字典。

第四个地方是content内容块。

内容块的改写分四种类型。

tool_use是Anthropic的块。

tool_use按id匹配。

改写时丢掉partial_json。

partial_json残留会泄露旧参数。

function_call是OpenAI Responses的块。

function_call按call_id匹配。

fc_开头的item id保留。

tool_call和tool_call_chunk是LangChain v1标准内容。

tool_call的args是字典。

tool_call_chunk的args是JSON字符串。

extras.arguments是原始provider字符串。

Responses翻译器优先用extras.arguments。

extras里有arguments时同步改写。

这个函数返回model_copy。

没有任何匹配时返回原对象。

这个函数从不改动原消息。

### 5、_without_response_chain_id函数

这个函数丢掉OpenAI的resp_响应id。

丢掉的原因是服务端续接会失效。

OpenAI适配器带resp_ id时只发送最后一条AIMessage之后的消息。

服务端用它自己存的对话重建前面的部分。

服务端存的还是原始参数。

服务端存的响应不能编辑。

改写后的调用之后的所有响应都链回那段历史。

所以只要改写了任何内容就丢掉全部resp_ id。

适配器回退到完整重放改写后的历史。

按OpenAI的文档两种方式的链式输入token计费一样。

重放不多花钱。

## 三、它和谁协作

这个模块是共享库。

这个模块本身不注册进中间件链。

这个模块被read_before_write_middleware使用。

read_before_write用这个模块改写被拦截调用的死载荷。

这个模块被tool_output_budget_middleware使用。

tool_output_budget用这个模块改写被折叠的write_file参数。

这两个中间件用pair_tool_call_results按调用出现位置做配对决策。

这个模块的配对规则和DanglingToolCallMiddleware保持一致。

这个模块处理的四表面问题和tool_call_metadata互补。

tool_call_metadata负责删除工具调用时同步全部表面。

这个模块负责改写参数时同步全部表面。

## 重要性评级

评级是6分。

理由如下。

四表面不一致是一个非常隐蔽的bug来源。

只改tool_calls列表时OpenAI Responses适配器仍然发送原始载荷。

这类bug在特定provider上才爆发。

很难靠人工排查发现。

这个模块把改写收敛到一个地方。

所有中间件复用同一套表面同步逻辑。

resp_ id失效处理保证了OpenAI服务端续接的正确性。

配对函数是多个中间件的共同基础。

不评8分以上的原因是这个模块是纯辅助库。

这个模块不注册进中间件链。

这个模块只在改写历史参数的中间件被启用时才被用到。

所以评级是6分。
