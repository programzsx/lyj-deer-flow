# StreamEvent（stream_bridge版本）档案

这个档案描述`deerflow.runtime.stream_bridge.base`模块里的`StreamEvent`类。

还有一个同名类在`deerflow.client`模块里。那个类是给嵌入式客户端用的。两个类名字相同。职责不同。这个档案只讲stream_bridge版本。client版本的档案见`StreamEvent@client-档案.md`。

## 一、这个类是干什么的

`StreamEvent`是流桥里的一条事件。

流桥的英文是StreamBridge。流桥是后端SSE流式输出的骨干。

agent运行时会产生各种事件。这些事件不能直接塞给浏览器。这些事件要先进入流桥。流桥再按顺序吐给订阅者。

`StreamEvent`就是流桥里流动的一条条事件的统一包装。

## 二、类的成员

这个类是一个冻结的数据类。英文是dataclass。冻结意味着创建后不可修改。

这个类有三个字段。

`id`字段是事件编号。编号单调递增。这个编号用作SSE协议的`id:`字段。浏览器断线重连时带上`Last-Event-ID`头。流桥靠这个编号判断从哪里重放。

`event`字段是事件名称。事件名称是字符串。常见取值包括`metadata`。包括`updates`。包括`events`。包括`error`。包括`end`。

`data`字段是事件内容。内容要求可JSON序列化。不同事件名称对应不同的内容结构。

## 三、它和谁协作

生产者是agent运行时的worker。worker把运行事件包装成`StreamEvent`发布到流桥。

消费者是`sse_consumer`。消费者把`StreamEvent`转成SSE帧发给客户端。

`StreamGap`是它的邻居类。订阅者要的编号已经不在保留窗口里时。流桥返回`StreamGap`而不是硬重放。这是断线重连的正确性保障。

## 四、重要性评级

评级8分。

理由如下。

所有SSE输出都经过这个类。这个类是流式协议的基本单位。

`id`字段支撑断线重连。断线重连是前端体验的关键能力。

这个类很小。但是它处在核心路径上。改动它的字段就改动SSE协议本身。

所以给8分。不到10分是因为类本身逻辑简单。复杂度在流桥的其他部分。
