# SubagentCapacitySnapshot档案

源码位置：backend/packages/harness/deerflow/subagents/capacity.py

## 一、这个类是干什么的

SubagentCapacitySnapshot是容量控制器的一张快照。

SubagentCapacitySnapshot记录SubagentExecutionCapacity在某一刻的状态。运行数、排队数、上限、准入策略都在快照里。

SubagentCapacitySnapshot的用途是这样的。快照从非循环线程读。configure_subagent_execution_capacity等读它。快照避免跨线程迭代deque。跨线程迭代会报"deque mutated during iteration"。所以queued用len原子读。原始长度可能算进一个刚超时但还没移除自己的等待者。这只让"容量忙"的答案更保守。不会更乐观。

SubagentCapacitySnapshot是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- max_running：最大运行数。
- running：当前运行数。
- max_queued：最大排队数。
- queued：当前排队数。
- admission_policy：准入策略。

## 三、它和谁协作

（一）产生者

SubagentExecutionCapacity的snapshot方法产生快照。

（二）消费者

configure_subagent_execution_capacity用快照判断是否有活跃执行。get_subagent_execution_capacity用快照判断能否重新绑定循环。

## 四、重要性评级

评级：3分。

理由：SubagentCapacitySnapshot是容量状态的只读投影。它解决跨线程读取的竞态。它是五字段数据类。给3分。
