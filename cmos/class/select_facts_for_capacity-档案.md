# select_facts_for_capacity-档案

## 一、这个类是干什么的

select_facts_for_capacity不是类。

它是agents/memory/backends/deermem/deermem/core/eviction.py里的模块级函数。

eviction.py是DeerMem的容量淘汰模块。

这个函数在配置的cap下选择facts。

不改快照。

confidence策略精确保留历史排序。

hybrid-v1结合三个有界信号。

confidence、显式确认新鲜度、query驱动的访问热度。

只保留最小数量的correction槽。

未用槽立即回到普通竞争。

这个模块位于backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/eviction.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、select_facts_for_capacity函数

流程如下。

第一步给每个fact评分。

_score_fact按策略计算。

hybrid-v1用三个权重。

confidence_weight默认0.65。

confirmation_weight默认0.25。

access_weight默认0.10。

半衰期确认90天。访问30天。

第二步数量不超cap时全部保留。

第三步按分数排序。负分数加索引。稳定排序。

第四步hybrid-v1策略时保留correction槽。

槽的数量是min(reserved_max, ceil(max_facts乘fraction))。

fraction默认0.10。reserved_max默认10。

correction facts优先占据。

第五步按排名填充剩余槽。

第六步未选中的进evicted列表。

带分数。

### 2、数据类

FactEvictionScore是单个fact的淘汰分数。

EvictedFact是被淘汰的fact。带分数和原因。

FactEvictionDecision是淘汰决策。kept加evicted加scores加policy。

### 3、_decay

指数衰减。elapsed_days和half_life_days。

### 4、_confirmation_freshness

显式确认的新鲜度分数。

### 5、_normalized_access_heat

query驱动的访问热度。有界。

### 6、_bounded_number

有界数值。

## 三、它和谁协作

- DeerMem的存储层调它做容量淘汰。
- usage提供访问热度。
- DeerMemConfig提供策略和权重。

## 四、重要性评级

评级是6分。

理由如下。

这个函数是DeerMem容量淘汰的大脑。

hybrid-v1三个信号加权。

correction槽保护纠正facts。

未用槽回普通竞争。

不改快照。稳定排序。

这些是内存质量的关键。

扣掉4分。

扣分原因是它是淘汰策略。可替换。
