# FactEvictionDecision档案

源文件位置：backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/eviction.py

## 一、这个类是干什么的

这个类是一个数据容器。

这个类表示一次容量淘汰决策的完整结果。

记忆库事实数量超过上限时，系统要调用淘汰策略。淘汰策略对整个事实快照打分。打分之后，一部分事实被保留，一部分事实被淘汰。这个类把完整结果装在一起。这个类记录哪些事实被保留。这个类记录哪些事实被淘汰。这个类记录每条事实的得分。这个类记录用的是哪种策略。这个类还记录为correction类别保留了多少个槽位。

这个类不修改任何数据。这个类只是选择结果。调用方决定要不要按这个结果落盘。

## 二、类的成员

这个类是frozen dataclass。这个类的实例创建后不能修改。

### （一）字段

- kept：被保留的事实列表。列表元素是原始事实字典。
- evicted：被淘汰事实的元数据记录列表。列表元素是EvictedFact。
- scores：所有事实的打分映射。键是事实ID。值是FactEvictionScore。
- policy：本次决策使用的策略名。可选值是confidence和hybrid-v1。
- reserved_correction_slots：为correction类别保留的槽位数。这个字段默认为0。hybrid-v1策略会预留少量槽位给纠正类事实。没用完的槽位立即回到普通竞争。

## 三、它和谁协作

- select_facts_for_capacity负责生成这个类。这个函数是eviction.py的核心入口。
- MemoryUpdater负责消费这个类。更新器的_select_for_capacity方法调用淘汰函数并拿到这个决策。
- FileMemoryStorage负责消费这个类。存储层调用record_capacity_eviction时把这个决策写入审计文件。
- shadow模式下会同时生成两个决策。一个决策是实际执行的confidence策略。另一个决策是shadow的hybrid-v1策略。两个决策的分歧会被记录下来。

## 四、重要性评级

评级：4分。

理由：这个类是淘汰机制的完整输出。容量控制靠这个类传递结果。这个类携带了shadow模式对比所需的信息。但是这个类是纯数据类。这个类本身不做任何决策计算。真正的打分和选择逻辑在select_facts_for_capacity函数里。
