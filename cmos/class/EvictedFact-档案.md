# EvictedFact档案

源文件位置：backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/eviction.py

## 一、这个类是干什么的

这个类是一个数据容器。

这个类记录一条被容量限制淘汰掉的事实。

记忆库有容量上限。事实数量超过上限时，系统要淘汰一些事实。被淘汰的事实不能悄悄消失。系统要用EvictedFact记录被淘汰事实的元数据。这些记录会写入淘汰审计文件。这样运维人员可以追溯哪些事实被淘汰了。为什么被淘汰也能追溯。

这个类只存元数据。这个类不存被淘汰事实的正文内容。

## 二、类的成员

这个类是frozen dataclass。这个类的实例创建后不能修改。

### （一）字段

- fact_id：被淘汰事实的ID。
- category：被淘汰事实的类别。类别缺失时默认为context。
- score：这条事实在淘汰打分中的得分。得分越低越容易被淘汰。
- components：得分的构成明细。这是一个字典。字典里记录了各个打分分量。例如置信度分量、确认新鲜度分量、访问热度分量。

## 三、它和谁协作

- FactEvictionDecision负责持有这个类。淘汰决策的evicted字段就是这个类的列表。
- select_facts_for_capacity负责生成这个类的实例。这个函数在排序后把落选事实包装成EvictedFact。
- FileMemoryStorage负责消费这个类。存储层调用record_capacity_eviction时把这些记录写入审计侧车文件。

## 四、重要性评级

评级：3分。

理由：这个类是淘汰机制的审计载体。淘汰机制本身可解释、可追溯，靠的就是这个类携带的components明细。但是这个类是纯数据类。这个类不参与核心存储和检索逻辑。丢失这个类不影响记忆功能，只影响审计能力。
