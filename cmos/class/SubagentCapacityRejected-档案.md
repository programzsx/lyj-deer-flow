# SubagentCapacityRejected档案

源码位置：backend/packages/harness/deerflow/subagents/capacity.py

## 一、这个类是干什么的

SubagentCapacityRejected是一个异常类。

SubagentCapacityRejected表示进程队列满了。或者配置的策略就是拒绝。

具体的场景是运行数已到上限、队列也满。这时新的执行直接被拒绝。不排队。

SubagentCapacityRejected继承SubagentCapacityError。

## 二、类的成员

SubagentCapacityRejected没有自定义字段。SubagentCapacityRejected没有自定义方法。异常消息由raise处传入。消息带运行数和排队数。

## 三、它和谁协作

（一）产生者

SubagentExecutionCapacity的_acquire抛它。策略是reject或队列满时抛。

（二）消费者

SubagentExecutor捕获它。准入失败释放持久租约。不消耗条目的重试预算。

## 四、重要性评级

评级：3分。

理由：SubagentCapacityRejected是容量拒绝的标准信号。调用方靠它区分"被拒绝"和"超时"。被拒绝的执行立即失败。给3分。
