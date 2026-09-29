# StreamEvent-档案

说明。

这个类名在代码库里出现两次。

第一处在backend/packages/harness/deerflow/client.py。

第二处在backend/packages/harness/deerflow/runtime/stream_bridge/base.py。

本档案写的是client.py的StreamEvent。

runtime/stream_bridge/base.py的同名类是另一份。

本档案命名已按重名规则处理，保留原名是因为这是第一份。

# StreamEvent@client-档案

## 一、这个类是干什么的

这个数据类是内嵌客户端流式响应的单个事件。

DeerFlowClient.stream()会产出一系列这个对象。

每个对象代表一个流式事件。

事件类型和LangGraph SSE协议对齐。

这样消费方可以在HTTP流式和内嵌模式之间切换。

切换时不需要改事件处理逻辑。

这个类位于backend/packages/harness/deerflow/client.py。

## 二、类的成员（字段、方法，各自做什么）

这个类是纯数据类，没有方法。

字段如下。

- type是事件类型。取值是"values"、"messages-tuple"、"custom"、"end"之一。
- data是事件载荷字典。默认值是空字典。内容随类型变化。

各类型事件的data内容如下。

### 1、values类型

data包含title、summary_text、messages、artifacts。

这是状态快照。

title是会话标题。

summary_text是当前摘要或None。

messages是序列化后的消息列表。

artifacts是产物列表。

### 2、messages-tuple类型

data随内容变化。

- AI文本增量是type为ai、content为增量文本、id为消息id。
- 带用量时附加usage_metadata。
- 带新元数据时附加additional_kwargs。
- 工具调用事件是type为ai、content为空、tool_calls为列表。
- 工具结果是type为tool、content、name、tool_call_id、id。源ToolMessage的artifact非None时也带artifact。

### 3、custom类型

data是StreamWriter发出的原始载荷。

### 4、end类型

data包含usage。usage里有input_tokens、output_tokens、total_tokens。这是本轮的累计用量。

## 三、它和谁协作

- DeerFlowClient.stream()生产这个对象。
- DeerFlowClient.chat()消费这个对象，按id累计AI文本增量。
- 内嵌调用方和测试消费这个对象。

## 四、重要性评级

评级是6分。

理由如下。

这个类是内嵌客户端流式接口的事件单元。

事件类型与Gateway的SSE协议对齐。

这种对齐让消费方不用改代码就能换通道。

但它是纯数据类。

只有两个字段。

扣掉4分。
