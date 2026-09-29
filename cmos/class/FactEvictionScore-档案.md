# FactEvictionScore档案

源文件位置：backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/eviction.py

## 一、这个类是干什么的

这个类是一个数据容器。

这个类表示一条事实在淘汰策略下的有界得分。

淘汰策略要给每条事实打分。打分的目的是排序。得分低的事实先被淘汰。这个类把一条事实的得分和得分的构成装在一起。得分是有界的。得分的取值范围在0到1之间。得分的构成是可解释的。构成里能看清每个分量贡献了多少。

淘汰机制的可解释性靠这个类保证。只给一个总分是不够的。运维人员需要知道总分是怎么来的。

## 二、类的成员

这个类是frozen dataclass。这个类的实例创建后不能修改。

### （一）字段

- value：这条事实的综合得分。这个值是有界的。confidence策略下这个值就是置信度。hybrid-v1策略下这个值是三个分量的加权和。
- components：得分的构成明细。这是一个字典。confidence策略下字典只有一个confidence分量。hybrid-v1策略下字典有三个分量。三个分量分别是confidence（置信度）、confirmationFreshness（确认新鲜度）、accessHeat（访问热度）。

## 三、它和谁协作

- _score_fact函数负责生成这个类。这个私有函数根据策略计算得分并包装成这个类。
- FactEvictionDecision负责持有这个类。决策的scores字典以事实ID为键存放这个类。
- EvictedFact从这个类取数据。被淘汰事实的score和components字段来自这里的值。

## 四、重要性评级

评级：3分。

理由：这个类是淘汰打分的最小单元。可解释的components字段让淘汰决策能被审计。但是这个类是纯数据类。这个类只有两个字段。这个类不参与存储、更新、检索等核心逻辑。数据类的重要性适中偏低。
