# SubagentCapacityTimeout档案

源码位置：backend/packages/harness/deerflow/subagents/capacity.py

## 一、这个类是干什么的

SubagentCapacityTimeout是一个异常类。

SubagentCapacityTimeout表示一个排队的执行在截止时间前没有拿到slot。

具体场景是执行进入队列等待。等待时间超过queue_timeout_seconds。等待失败。

SubagentCapacityTimeout继承SubagentCapacityError。

## 二、类的成员

SubagentCapacityTimeout没有自定义字段。SubagentCapacityTimeout没有自定义方法。异常消息带等待的秒数。

## 三、它和谁协作

（一）产生者

SubagentExecutionCapacity的_acquire抛它。wait_for超时后抛。

（二）消费者

SubagentExecutor捕获它。超时的执行不运行。不消耗重试预算。

## 四、重要性评级

评级：3分。

理由：SubagentCapacityTimeout是排队超时的标准信号。它保证排队不会无限等。调用方靠它识别超时失败。给3分。
