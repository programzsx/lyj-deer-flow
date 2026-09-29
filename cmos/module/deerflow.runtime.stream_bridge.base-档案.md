# deerflow.runtime.stream_bridge.base-档案

## 一、这个模块是干什么的

这个文件是流桥的抽象协议。

StreamBridge解耦两类角色。

生产者是agent worker。生产者发布流事件。

消费者是SSE端点。消费者订阅流事件。

这个设计对齐LangGraph Platform的Queue加StreamManager架构。

一个run产生一串事件。事件通过桥从worker流向SSE。SSE再流向浏览器。

## 二、模块里的主要成员

### 1、StreamEvent数据类

这是单个流事件。

三个字段。id是单调递增的事件id。用作SSE的id字段。支持Last-Event-ID重连。event是SSE事件名。比如metadata、updates、events、error、end。data是JSON可序列化的载荷。

### 2、StreamGap数据类

这是订阅游标无法完整重放时的信号。

三个字段。requested_event_id是重连游标。earliest_available_event_id是缓冲里最早可用的事件id。latest_available_event_id是最新可用的事件id。

缓冲里什么都没保留时后两个是None。

调用方拿到StreamGap后可以重新加载持久化状态。从当前尾部续传。不会把部分重放当成完整重放。

### 3、哨兵事件

HEARTBEAT_SENTINEL是心跳哨兵。事件名是__heartbeat__。订阅者在heartbeat_interval秒内没等到事件时收到它。它保持SSE连接活着。

END_SENTINEL是结束哨兵。事件名是__end__。生产者调用publish_end后订阅者收到它。它表示不会再有事件了。

### 4、StreamItem类型别名

StreamItem是StreamEvent或StreamGap的联合类型。订阅迭代器yield的就是它。

### 5、StreamBridge抽象类

这是桥的抽象基类。

supports_cross_process类属性标记桥是否支持跨进程。memory桥是False。redis桥是True。

#### （1）心跳间隔

__init__接收heartbeat_interval。默认值来自配置常量。

_validate_heartbeat_interval校验间隔。必须是正的有限数。不能超过最大值。布尔类型被拒绝。因为布尔是int的子类。

_resolve_heartbeat_interval解析每次订阅的间隔。订阅时显式传入的优先。没传用桥的默认。

#### （2）四个抽象方法

publish给一个run入队一个事件。生产者侧。

publish_end发出结束信号。表示这个run不会再有事件。

subscribe返回异步迭代器。消费者侧。超时yield心跳哨兵。生产者结束时yield结束哨兵。订阅者落后于保留历史时yield StreamGap并停止。

cleanup释放一个run关联的资源。delay大于0时先等一下。给晚到的订阅者排空的机会。

close释放后端资源。默认空操作。

## 三、它和谁协作

它依赖config里的stream_bridge_config常量。

它被runtime.stream_bridge.memory和redis实现。

它被runtime.stream_bridge.async_provider创建。

它被runtime.runs.worker调用。worker向桥发布事件。

它被Gateway的SSE端点消费。

## 四、重要性评级

评级是7分。

理由是这个文件定义了整个流式链路的协议。

StreamEvent、StreamGap、心跳、结束信号全部定义在这里。

Last-Event-ID重连语义和落后检测信号都靠这个契约。

删掉它，worker和SSE端点失去共同语言。

不评更高分是因为它只有协议。行为在memory和redis实现里。
