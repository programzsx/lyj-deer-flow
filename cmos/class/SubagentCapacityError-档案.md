# SubagentCapacityError档案

源码位置：backend/packages/harness/deerflow/subagents/capacity.py

## 一、这个类是干什么的

SubagentCapacityError是一个异常基类。

SubagentCapacityError是显式准入失败的基类。

SubagentCapacityError有两个子类。SubagentCapacityRejected和SubagentCapacityTimeout。

SubagentCapacityError继承RuntimeError。

## 二、类的成员

SubagentCapacityError没有自定义字段。SubagentCapacityError没有自定义方法。

（一）子类

- SubagentCapacityRejected：进程队列满或配置为拒绝。
- SubagentCapacityTimeout：排队的执行在截止时间前没拿到slot。

## 三、它和谁协作

（一）产生者

SubagentExecutionCapacity的_acquire抛这两个子类。队列满抛Rejected。排队超时抛Timeout。

（二）消费者

SubagentExecutor捕获它们。准入失败发生在模型执行之前。准入失败不消耗重试预算。

## 四、重要性评级

评级：3分。

理由：SubagentCapacityError是准入失败的类型体系根。调用方靠类型区分队列满和排队超时。它本身没有逻辑。给3分。
