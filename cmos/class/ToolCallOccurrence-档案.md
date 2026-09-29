# ToolCallOccurrence档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/tool_call_args.py`

## 一、这个类是干什么的

ToolCallOccurrence表示一次工具调用的出现。

一条AI消息上的一次工具调用。
配上回答它的那条ToolMessage。
没有回答就是None。

为什么要配对。

有些中间件要在模型绑定的请求里缩小或替换历史工具调用的参数。
决定改哪个调用、换成什么。
要按调用出现来决定。
每一次出现是一条AI消息调用加它的ToolMessage结果的配对。

背景是LangChain的AIMessage在最多四个表面上携带同样的参数。
tool_calls是结构化列表。大多数适配器优先读它。
additional_kwargs里的tool_calls是原始provider载荷。
content块里有Anthropic tool_use、OpenAI Responses function_call的副本。
AIMessageChunk上还有tool_call_chunks。

只改一个表面。原始载荷还能从别的表面漏出去。
严格提供方会收到表面互相矛盾的请求。
rewrite_tool_call_args把所有表面一起改。
策略留在调用方。配对数据由这个类承载。

## 二、类的成员

### （一）字段

- `index`：这条调用在AI消息里的位置。
- `message`：携带调用的AIMessage。
- `tool_call`：结构化的调用字典。
- `result`：回答这条调用的ToolMessage。没有就是None。

### （二）方法

便捷属性：

- `call_id`（property）：调用的id。
- `name`（property）：工具名。
- `args`（property）：调用的参数字典。

## 三、它和谁协作

- tool_call_args模块的配对函数产出它。
- ReadBeforeWriteMiddleware的载荷省略消费它。
- ToolOutputBudgetMiddleware的写作载荷省略消费它。

## 四、重要性评级

评级：5/10。

理由：ToolCallOccurrence是跨表面参数重写的数据单元。四表面一致性问题的修复依赖它。它是纯数据。行为在配对和重写函数里。所以给5分。