# deerflow.runtime.converters 档案

## 一、这个模块是干什么的

这个模块做一件事。把LangChain的消息对象转换成OpenAI Chat Completions格式的字典。

LangChain的消息类型是HumanMessage、AIMessage、SystemMessage、ToolMessage。

OpenAI的线上格式是`{"role": "user", "content": "..."}`这样的字典。

两边词汇不同。角色名不同。结构不同。

这个模块就是翻译层。

它的定位是备用工具。模块文档自己写着。它目前没有接入RunJournal。RunJournal直接用`message.model_dump()`。这个模块留给需要OpenAI线上格式的消费者。

## 二、模块里的主要成员

- `langchain_to_openai_message(message)`。转换单条消息。角色映射是human变成user。ai变成assistant。system和tool不变。tool消息带`tool_call_id`。assistant消息处理tool_calls。参数会被json序列化。没有文本内容时content设为None。符合OpenAI规范。多模态的list内容原样保留。

- `_infer_finish_reason(message)`。推断OpenAI的finish_reason。有tool_calls就返回`tool_calls`。否则看response_metadata里的finish_reason。都没有就返回`stop`。

- `langchain_to_openai_completion(message)`。把一条AIMessage加元数据转成完整的completion响应字典。包含id、model、choices、usage。usage从usage_metadata算出来。包含prompt_tokens、completion_tokens、total_tokens。

- `langchain_messages_to_openai(messages)`。批量转换。就是列表推导式套第一函数。

## 三、它和谁协作

它只依赖标准库json和typing。

它处理的是LangChain消息对象。但不直接依赖langchain_core。它用getattr鸭子类型读属性。

它的潜在消费者是需要OpenAI兼容格式的导出工具或API适配层。

runtime的journal不依赖它。

## 四、重要性评级

评级是2分。

理由如下。

它是纯工具函数。没有状态。没有并发问题。没有持久化语义。

模块文档明确说它当前没有被接入主流程。

它处理的转换逻辑不复杂。出错也不会丢数据。

但它是完整的、测试友好的独立翻译层。如果未来要暴露OpenAI兼容API。它就是现成的。

所以给2分。低分是因为当前不在关键路径上。给分是因为它随时可用且无风险。
