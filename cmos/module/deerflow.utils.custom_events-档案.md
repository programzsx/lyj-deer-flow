# deerflow.utils.custom_events 档案

## 一、这个模块是干什么的

这个模块提供"DeerFlow自定义流事件的兼容性助手"。

DeerFlow的agent运行会发出自定义事件。任务进度。技能激活。等等。

事件要发到两个地方。

一个是LangGraph的custom流。通过StreamWriter。这是主路径。Gateway、Web UI、embedded客户端都消费它。

一个是LangChain的回调API。通过dispatch_custom_event。这让`astream_events`消费者也能收到。

这个模块封装"双发"逻辑。写一个助手。两个地方都发。

## 二、模块里的主要成员

- `emit_custom_event(payload, writer)`。同步版本。发一个事件到LangGraph的custom流和回调API。

  - writer先跑。writer是主兼容路径。回调派发是尽力而为。可选的astream_events消费者失败不能打断一个正在跑的DeerFlow运行。

  - payload必须有非空字符串`type`。没有type的载荷跳过回调派发。只走writer。留在writer-only状态。

  - `GraphBubbleUp`异常原样重抛。这是LangGraph的控制流异常。吞掉它会破坏图的执行。其他异常只打debug日志。

- `aemit_custom_event(payload, writer)`。异步版本。用adispatch_custom_event。

## 三、它和谁协作

它依赖langchain_core的custom event派发。依赖langgraph的GraphBubbleUp。

它被所有需要发自定义事件的agent组件依赖。client.py的文档写着。内置的custom事件通过这个模块双发。不用StreamWriter单独发。

它被事件消费方依赖。astream_events消费者靠它收到on_custom_event。

## 四、重要性评级

评级是5分。

理由如下。

双发契约是流式数据流的关键规则。writer是权威。回调尽力。这个优先级在这里落实。

typeless载荷的行为有明确定义。writer-only。不进astream_events。

GraphBubbleUp的重抛处理避免了破坏LangGraph控制流的隐蔽bug。

扣分原因。它是薄薄的兼容层。57行。两个函数。逻辑简单。但它是流式契约的执行点。用错会丢事件。
