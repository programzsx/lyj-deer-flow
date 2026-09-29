# SubagentExecutionCapacity档案

源码位置：backend/packages/harness/deerflow/subagents/capacity.py

## 一、这个类是干什么的

SubagentExecutionCapacity是原生子Agent执行的准入控制器。

SubagentExecutionCapacity是FIFO异步容量控制器。排队的永远不拥有线程。

SubagentExecutionCapacity的工作方式是这样的。

第一。有最大运行数。运行数没到上限就直接拿slot。

第二。到上限就排队。排队有上限。排队满了或策略是reject就抛SubagentCapacityRejected。

第三。排队等待有超时。超时抛SubagentCapacityTimeout。

第四。释放slot时优先转移给排队者。转移的是现有slot。运行计数保持不变。没有排队者时运行计数减一。

slot方法是一个异步上下文管理器。进入时获取。退出时释放。释放是取消安全的。重复取消先释放slot再传播。

模块级还有单例管理。configure_subagent_execution_capacity安装启动快照。get_subagent_execution_capacity返回绑定当前执行循环的控制器。

## 二、类的成员

（一）字段

- _config：运行时配置。
- _lock：asyncio锁。
- _running：当前运行数。
- _waiters：排队者的Future队列。

（二）方法

- slot：异步上下文管理器。获取和释放slot。
- snapshot：返回容量快照。snapshot从非循环线程读。len原子读。

（三）相关类和函数

- SubagentCapacityError：显式准入失败的基类。
- SubagentCapacityRejected：队列满或配置为拒绝。
- SubagentCapacityTimeout：排队超时。
- SubagentCapacitySnapshot：容量快照。max_running、running、max_queued、queued、admission_policy。
- get_subagent_execution_capacity：返回绑定当前循环的控制器。
- configure_subagent_execution_capacity：安装启动快照。活跃执行中不能重新配置。

## 四、重要性评级

评级：8分。

理由：SubagentExecutionCapacity是子Agent并发执行的总闸。所有原生子Agent执行都要经过它。它的slot转移设计避免了不必要的运行计数波动。取消安全的释放防止slot泄漏。单例管理处理了多循环、活跃执行中重配置等边界。给8分。
