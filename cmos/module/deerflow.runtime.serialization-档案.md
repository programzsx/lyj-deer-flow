# deerflow.runtime.serialization 档案

## 一、这个模块是干什么的

这个模块做LangChain和LangGraph对象的"规范序列化"。

LangChain的消息对象、Pydantic模型、LangGraph的状态字典。都不是直接的JSON数据。

要把它们发给前端。发给REST客户端。发给SSE流。必须先转成纯Python的JSON可序列化结构。

这个模块提供"单一事实来源"的转换函数。

所有消费者用同一套转换。不会出现各个地方各自转换、行为不一致的问题。

它还处理两个特殊的清理。

一个是从channel values里剥掉LangGraph的内部键。

一个是把`hide_from_ui`消息里的base64图片数据从API响应里剥掉。

## 二、模块里的主要成员

- `serialize_lc_object(obj)`。核心递归函数。递归序列化任意LangChain对象。基础类型直接返回。字典和列表递归。Pydantic v2对象用`model_dump()`。旧对象用`dict()`。LangGraph的Interrupt是`__slots__`类。没有dump方法。走到最后会用str()产生畸形载荷。所以有专门的处理。把它转成`{value, id}`字典再递归。最后的兜底是str。str也失败就用repr。

- `serialize_channel_values(channel_values)`。序列化channel values。只剥`__pregel_*`键。`__interrupt__`故意保留。因为LangGraph SDK要从values块里检测中断事件。这是issue #3595的处理。

- `strip_data_url_image_blocks(messages)`。从`hide_from_ui`消息里剥掉`data:`协议的image_url块。背景是ViewImageMiddleware现在把base64图片留在模型请求里。不进checkpoint。但老版本checkpoint的线程还留着这些载荷。这些是内部模型上下文。不该发给前端。响应会巨大而且没有UI价值。只剥`data:`协议的。文本块、`https://`图片、非隐藏消息都不动。消息顺序和数量保持不变。

- `serialize_channel_values_for_api(channel_values)`。组合前两个。REST端点返回channel values时用这个。保证base64数据不上线。

- `serialize_messages_tuple(obj)`。序列化messages模式的`(chunk, metadata)`元组。

- `serialize(obj, mode)`。带模式的统一入口。messages模式处理元组。values模式走API清理。其他走递归兜底。

## 三、它和谁协作

它只依赖typing和langgraph的类型（延迟导入）。

它的消费者在模块文档里写明了。`deerflow.runtime.runs.worker`负责SSE发布。`app.gateway.routers.threads`负责REST响应。

Gateway和embedded runtime的所有对外序列化都通过它。

## 四、重要性评级

评级是6分。

理由如下。

它是所有对外数据出口的必经转换点。SSE和REST都靠它。

它处理了几个真实的坑。Interrupt的畸形载荷。老checkpoint的base64图片泄漏。内部键的剥离。

它保证了两条出口路径的序列化行为一致。

扣4分是因为它是纯函数模块。没有状态。没有并发。逻辑虽密但都是转换规则。出错的影响是显示问题而不是数据损坏。
