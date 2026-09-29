# eviction.py 档案

模块全名是deerflow.agents.memory.backends.deermem.deermem.core.eviction。

源文件位置是backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/eviction.py。

## 一、这个模块是干什么的

这个模块是记忆事实的容量淘汰策略。

它回答一个问题。

这个问题是"事实太多超过了max_facts上限时，留下哪些、淘汰哪些"。

淘汰必须讲道理。

所以策略是确定性的。

策略是可解释的。

每个事实的分数带可解释的组成部分。

策略不调用模型。

策略不访问网络。

同样的输入永远产生同样的决定。

所有自动、手动、工具、导入的写入路径都使用这个模块。

有两个策略。

confidence是默认策略。

hybrid-v1是可选项。

hybrid-v1组合置信度、确认新鲜度、访问热度三个信号。

影子模式记录两种策略的不同意见。

影子模式强制执行confidence选择。

## 二、模块里的主要成员

（一）三个冻结数据类

FactEvictionScore是一个事实的有界策略分数。

分数带可解释的组成部分字典。

EvictedFact是被容量上限移除的事实的元数据记录。

只带fact_id、category、score、components。

不带完整内容。

FactEvictionDecision是对一个快照应用容量策略的完整结果。

字段包括：

- kept，保留的事实列表。
- evicted，淘汰事实的元数据列表。
- scores，每个事实的分数。
- policy，使用的策略名。
- reserved_correction_slots，保留的correction槽位数。

（二）两个策略常量

EVICTION_POLICY_CONFIDENCE是"confidence"。

这是默认策略。

EVICTION_POLICY_HYBRID_V1是"hybrid-v1"。

这是可选策略。

（三）_bounded_number函数

_bounded_number把值压到[0,1]。

None和布尔返回默认值。

不可转换和非有限值返回默认值。

（四）_parse_datetime函数

_parse_datetime解析ISO格式时间字符串。

解析失败返回None。

无时区的时间假定UTC。

最后统一转成UTC。

（五）_decay函数

_decay计算指数衰减。

公式是2的负(经过天数除以半衰期)次方。

半衰期为0时返回0。

（六）_confirmation_freshness函数

_confirmation_freshness计算确认的新鲜度。

优先用lastConfirmedAt。

lastConfirmedAt存在时按它算衰减。

不存在时回退到createdAt。

createdAt是更弱的证据。

所以createdAt的衰减值再乘0.5。

两个时间都没有时返回0。

（七）_normalized_access_heat函数

_normalized_access_heat计算归一化的访问热度。

它从使用量字典里取lastAccessedAt和accessHeat。

热度乘时间衰减。

再经过log1p对数压缩归一化到[0,1]。

使用量缺失、时间缺失、热度非正时返回0。

（八）_score_fact函数

_score_fact按策略给单个事实打分。

confidence策略直接返回置信度本身。

组成部分只有confidence一项。

hybrid-v1策略组合三个信号。

公式是confidence_weight乘confidence加confirmation_weight乘confirmation加access_weight乘access。

未知策略抛ValueError。

（九）select_facts_for_capacity函数

select_facts_for_capacity是主入口。

它在配置的上限内选择事实。

它不修改传入的快照。

默认权重是confidence_weight 0.65、confirmation_weight 0.25、access_weight 0.10。

三个权重必须加起来等于1.0。

默认半衰期是确认90天、访问30天。

函数的流程如下。

第一步确定评估时间。传入now或用当前时间。统一转UTC。

第二步给每个事实打分。

缺失id的事实用__missing_{index}占位。

第三步事实数不超上限时直接全部保留返回。

第四步超上限时排序。

排序键是分数降序加原始索引。

原始索引保证同分时顺序稳定。

第五步hybrid-v1策略时保留correction槽位。

槽位数是min(correction_reserved_max, ceil(max_facts乘correction_reserved_fraction))。

correction类别的事实优先占据槽位。

槽位数也受实际correction事实数和max_facts约束。

未用满的槽位立即回到普通竞争。

第六步按排名填满剩余名额。

第七步构造淘汰列表。

淘汰列表按排名倒序遍历。

每个淘汰项带fact_id、category、分数、组成部分。

category缺失时默认context。

## 三、影子模式

影子模式的用法是这样的。

实际执行的策略是confidence。

影子策略是hybrid-v1。

两个决定同时计算。

影子决定只记录，不执行。

storage.py的record_capacity_eviction记录两个决定的差异。

差异写入审计侧车文件。

影子模式的目的安全评估hybrid-v1。

评估hybrid-v1和confidence的分歧有多大。

分歧数据支撑是否切换策略的决策。

## 四、设计意图

这个模块体现三个设计。

第一个设计是可解释性。

每个分数带组成部分。

每个淘汰项带分数和组成部分。

审计可以回答"为什么淘汰这个事实"。

第二个设计是向后精确兼容。

confidence策略精确保留历史排序。

不启用hybrid-v1时行为逐字节不变。

第三个设计是不修改输入。

快照是调用方的。

函数返回新的决定。

调用方决定怎么用。

## 五、它和谁协作

（一）它依赖谁

它只依赖标准库的math、dataclasses、datetime、typing。

（二）谁调用它

updater.py的_select_for_capacity调用它。

updater传入配置的权重、半衰期、上限。

updater还用它算影子决定。

storage.py的record_capacity_eviction消费FactEvictionDecision写审计侧车。

基准评估脚本scripts/benchmark/deermem_eviction/评估这个函数。

基准只对比历史confidence策略和PR #4789的可选hybrid-v1。

不添加其他淘汰策略。

## 六、重要性评级

评级是6分（满分10分）。

理由如下。

这个模块决定记忆的容量上限怎么执行。

事实超上限时淘汰谁直接影响记忆质量。

它的设计精细。

三个信号加权组合、指数时间衰减、correction槽位保留、可解释组件。

它的确定性很重要。

淘汰决定不能随机。

审计和评估都依赖确定性。

但它是容量控制的策略核心，不是数据安全的边界。

淘汰只发生在事实超上限时。

默认策略精确保留历史行为。

hybrid-v1是可选的。

影子模式让切换是渐进的。

模块本身只有247行。

逻辑自洽。

评6分。
