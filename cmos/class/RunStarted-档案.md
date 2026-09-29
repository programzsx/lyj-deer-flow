# RunStarted档案

源码位置：backend/packages/harness/deerflow/tui/view_state.py

## 一、这个类是干什么的

RunStarted是一个动作类。

RunStarted表示一轮Agent运行开始了。

runtime.py的stream_actions在每次运行前固定先派发RunStarted。reduce收到后把streaming设为True。同时清空streaming_id和streaming_anonymous_row_index。

清空这两个字段是刻意的。新一轮开始时客户端会先重发历史消息。历史消息不能被误当成正在流式的内容。

RunStarted是不可变的。类声明用了frozen=True。RunStarted没有字段。

## 二、类的成员

（一）字段

RunStarted没有字段。

（二）方法

RunStarted是dataclass。RunStarted没有自定义方法。

## 三、它和谁协作

（一）产生者

runtime.py的stream_actions是产生者。每次运行开始先yield一个RunStarted。

（二）消费者

view_state.py的reduce函数是消费者。app.py的_on_action还靠RunStarted更新_streaming标志。

## 四、重要性评级

评级：3分。

理由：RunStarted是个空动作类。但它的职责很关键。它标记运行边界。它决定流式状态什么时候开启。它还负责重置流式id。没有它，跨轮的增量匹配会出bug。所以给3分。
