# 模块档案：deerflow.agents.memory.signals.coordinator

## 一、这个模块是干什么的

这个模块是记忆层judge本体。

DeerMem更新器只调用这一个对象。

这个对象对一批对话同时做两件事。

第一件事是预筛。

第二件事是信号分类。

为什么需要一个协调器。

因为两侧不能各自组装自己的请求。

这是设计文档第2.2节的"唯一权威"要求。

如果两侧各发各的请求。

同一个批次就会被发送两次。

相同的设置也会被重复使用。

协调器把这件事收拢到一个地方。

协调器的工作分三个阶段。

阶段A是逐侧资格判定。

每一侧独立决定这一轮能不能判。

预筛可以因为某些原因不合格。

这些原因分类器不一定有。

确定性信号可以让预筛不合格。

陈旧审查和合并维护可以让预筛不合格。

紧急刷新和停机排空可以让两侧都不合格。

阶段B是缓存和请求组装。

先按组合身份和本轮完整逻辑问题集查缓存。

再减去缓存里已经持有的答案。

然后决定怎么分组。

`combine: always`是一个请求。

`combine: never`是每侧一个请求。

`combine: auto`只在每个生效客户端设置都匹配时共享。

查缓存先于阶段A的收窄。

这一点很关键。

某一轮里可能只有一侧还合格。

这时已经进桶的答案可以复用。

不需要重新发送请求。

缓存全命中就什么都不发。

阶段C是消费。

模式只决定结果"意味着什么"。

预筛`shadow`是记录。

预筛`enforce`是跳过。

分类器`shadow`是记录。

分类器`hints`是合并。

有一个例外。

这个例外是否决。

预筛`enforce`乘以分类器`hints`乘以一个达到阈值的模型提示。

这时不跳过，改为提取。

失败永远是加法的。

一侧没有结果就贡献零。

同一响应里另一侧的有效答案照常消费。

调用方回退到自己的确定性行为。

预筛回退是照常提取。

信号分类回退是正则并集。

## （一）模块里的主要成员

### 1、回退原因常量

模块顶部定义了八个原因常量。

`REASON_DISABLED`是`"disabled"`。

这一侧没启用或模式是off。

`REASON_DRAIN`是`"shutdown_drain"`。

停机排空路径禁止判定。

`REASON_EMERGENCY`是`"emergency_flush"`。

紧急刷新路径跳过判定。

`REASON_SIGNALS`是`"deterministic_signals"`。

批里有确定性信号。

确定性正证据优先于模型负裁决。

`REASON_MAINTENANCE`是`"staleness_or_consolidation"`。

陈旧审查或合并维护开着。

跳过会连维护审查一起跳掉。

`REASON_OVER_LIMIT`是`"over_limit"`。

批次文本超过这一侧的字符上限。

`REASON_REQUEST_FAILED`是`"request_failed"`。

请求级失败，端点没打通。

`REASON_NO_VERDICT`是`"no_verdict"`。

请求通了但这一侧没有可用裁决。

这八个常量是审计记录的词汇表。

前六个是"本地回退"人群。

第七个和第八个是失败人群。

`request_failed`和`no_verdict`必须分开。

分开的原因是评估报告要分别统计这两个人群。

### 2、`MemoryBatchContext`数据类

这个类描述"更新器调用judge时知道的一个批次的全部信息"。

这个类是冻结的dataclass。

字段包括`batch_text`和`digest`。

字段包括`signals`冻结集合。

字段包括三个布尔开关。

`staleness_review_enabled`、`consolidation_enabled`、`bypass_watermark`。

字段包括`judged`。

`judged`为假表示停机排空路径。

字段还包括`thread_id`、`user_id`、`agent_name`、`trace_id`、`message_count`。

### 3、`MemoryBatchVerdict`数据类

这个类描述"更新器应该怎么处理这批对话"加上审计载荷。

这个类有四个字段。

`skip`是最终有效决定。

这里"最终"很关键。

被否决的skip到达这里时已经是`skip=False`。

`vetoed_by_model_signal`表示这个skip被模型提示否决了。

`hints`是模型提示标签。

分类器不在`hints`模式或没有可用答案时这是空集合。

`payload`是审计载荷字典。

这个类还有一个`decided`属性。

`payload`非空就表示这一轮有侧实际留下了记录。

### 4、两个可组合协议

`CombinablePrescreen`和`CombinableClassifier`是两个`Protocol`。

这两个协议分别继承预筛和分类器的Provider协议。

这两个协议描述"能共享请求的侧"。

能共享的侧要多暴露四个东西。

多暴露`questions()`方法。

多暴露`ask()`方法。

多暴露`interpret()`方法。

多暴露`sharing_key()`方法。

多暴露`max_state_chars`、`cache_size`、`cache_ttl_seconds`属性。

协调器只在合并路径用到这些成员。

单侧路径只需要`decide`。

### 5、两个内部数据类

`_Eligibility`描述一侧的资格判定结果。

`eligible`是布尔值。

`reason`是原因字符串。

不合格时reason记录为什么不合格。

`_SideOutcome`描述一侧本轮的结果。

`decision`是裁决，或者没有。

`request_failed`区分"请求没产生可用答案"和"提供方答了但没有裁决"。

这个区分必须活到这一层。

审计记录和shadow评估把这两个算成不同的回退。

### 6、`MemorySignalCoordinator`类

这个类是本模块的核心。

#### （1）构造函数

构造函数接受五个参数。

`prescreen`是预筛提供方，可以为`None`。

`prescreen_mode`是预筛模式，默认off。

`classifier`是分类器提供方，可以为`None`。

`classifier_mode`是分类器模式，默认off。

`combine`是组合策略，默认auto。

构造函数先校验`combine`。

`combine`不在`COMBINES`里就抛`ValueError`。

然后计算`self._combined`。

`combined`成立的条件是三个。

第一个是`combine`不等于never。

第二个是两侧都可组合。

第三个是两侧的配置匹配。

这里有一个重要的校验。

`combine`等于always但两侧无法组合时直接抛`ValueError`。

报错信息列出了必须匹配的全部设置。

模型、base_url、凭据指纹、超时、重试、传输工厂、字符上限、缓存设置。

这样运维人员能直接对齐两个配置。

然后决定是否建共享缓存。

`combined`成立才建`AnswerCache`。

缓存大小取两侧的较大值。

缓存TTL取两侧的较小值。

取较小TTL是有意保守。

TTL小的那一侧先过期。

过期后重新请求，保证不会用到侧认为过期的答案。

#### （2）`__call__`方法

这是钩子入口。

DeerMem递进来的是一个普通映射。

不是宿主类型。

这样做的原因是vendored后端不导入宿主判定类型。

和`extraction_callback`用的是同一个映射约定。

这个方法把映射适配成`MemoryBatchContext`。

调用方不给digest时在这里派生digest。

派生用的是`batch_digest(batch_text)`。

哈希策略因此收拢在一个地方。

身份字段用`_optional_str`处理。

不是字符串或空字符串就丢弃。

不stringify任何奇怪的类型。

#### （3）`judge`方法

这是核心判定方法。

这个方法对请求级失败永远不抛异常。

先记开始时间。

然后用`batch_chars`算批次文本长度。

然后做两侧的资格判定。

然后决定路径。

合并开启且至少一侧合格就走`_judge_combined`。

否则每侧各走单侧路径`_decide_prescreen`/`_decide_classifier`。

不合格的侧得到空的`_SideOutcome`。

最后算耗时，进入`_consume`阶段。

#### （4）单侧路径方法

`_decide_prescreen`构造`_prescreen_request`并调用`self._prescreen.decide`。

`TypeSafeError`被捕获。

捕获后返回`_request_failure(self._prescreen.name)`。

调用方照样提取。

`_decide_classifier`和它对称。

#### （5）`_judge_combined`方法

这是合并部署的请求组装。

先算完整逻辑问题集。

逻辑问题集是两侧问题字典的并集。

排序后变成元组。

`wanted`是本轮想问的问题。

预筛合格就加入预筛的问题。

分类器合格就加入分类器的问题。

缓存键是三元组。

三元组是共享键加逻辑问题集加digest。

查缓存得到`held`桶。

答案和模型都从桶里复制。

`missing`是想要的但桶里没有的问题。

`fetched`是本轮从网络拿到答案的问题ID集合。

`fetched_model`是本轮服务请求的模型。

有`missing`就发请求。

发请求用哪一侧的客户端。

任一客户端都可以。

合并部署保证每个生效设置都匹配。

所以让合格的侧来发。

预筛合格就让预筛发。

否则让分类器发。

`TypeSafeError`被捕获。

整个请求失败时不写桶。

合格侧全部没有结果。

它们回退。

这轮记录失败原因。

不合格侧保留自己的原因。

拿到答案后合并进答案和模型映射。

有有效答案就写回缓存桶。

最后用`_interpret_side`解释两侧。

#### （6）`_interpret_side`方法

这个静态方法按逐答案来源解释一侧。

一侧是缓存命中的条件是它消费的每个问题都来自桶。

它自己的任何一个问题本轮被fetch过。

这一侧就是网络样本。

它报告服务模型。

否则它报告桶里的模型。

这个区分很重要。

复用一个裁决不等于fetch一次。

shadow评估统计网络样本数。

缓存命中不算网络样本。

否则评估会重复计数。

置信度区间的分母会被夸大。

#### （7）阶段A方法

`_prescreen_eligibility`按顺序检查六个条件。

第一个条件是这一侧为`None`或模式是off。

这是`REASON_DISABLED`。

第二个条件是`context.judged`为假。

这是停机排空，`REASON_DRAIN`。

第三个条件是`context.bypass_watermark`为真。

这是紧急刷新，`REASON_EMERGENCY`。

第四个条件是`context.signals`非空。

这是`REASON_SIGNALS`。

确定性正证据优先于模型负裁决。

跳过会消费掉跳过点之后的全部反馈。

所以整份跳过点后的feed都要扫描这个否决。

第五个条件是陈旧审查或合并维护开着。

这是`REASON_MAINTENANCE`。

跳过会连这批的维护审查一起跳掉。

第六个条件是`_over_limit`超限。

这是`REASON_OVER_LIMIT`。

全部通过才是合格。

`_classifier_eligibility`检查的条件少两个。

分类器没有`REASON_SIGNALS`和`REASON_MAINTENANCE`。

确定性信号不影响分类器的资格。

维护开关也不影响分类器的资格。

#### （8）`_over_limit`方法

这个静态方法判断批次是否超过一侧的字符上限。

`max_state_chars`是判定文本的字符数。

字符数不是字节数。

这一点很重要。

共享客户端的`wire_size`是字节数。

字节数不替代任何消费方的上限。

字符上限对中文文本会早三倍触发字节回退。

所以这里坚持用字符数。

`format_conversation_for_update`的输出本身就是判定文本。

没有任何东西被截断来迁就上限。

超限的侧直接回退。

#### （9）`_consume`方法

这是阶段C。

先决定是否产出审计载荷。

任一侧启用就产出两个载荷。

两个载荷是`prescreen`和`signal_classification`。

然后计算最终skip。

skip成立的条件有四个。

第一个是预筛合格。

第二个是预筛决定是`MemoryPrescreenDecision`。

第三个是裁决是`VERDICT_SKIP`。

第四个是预筛模式是`enforce`。

然后计算hints。

分类器合格且决定是`MemorySignalDecision`且模式是`hints`。

hints就是labels。

否则hints是空集合。

然后处理唯一的例外。

skip和hints同时存在就否决。

skip变回False。

`vetoed`变True。

载荷里写入`skip_vetoed_by_model_signal`。

这是模型裁决改变提取决定的唯一路径。

最后返回`MemoryBatchVerdict`。

#### （10）两个payload方法

`_prescreen_payload`构造预侧审计记录。

记录内容包括模式、裁决、概率、`skip_threshold`、模型、cached、digest、signals、message_count、batch_chars、duration_ms。

还包括`fallback_reason`。

有决定时`fallback_reason`是`None`。

没有决定时`fallback_reason`来自`_fallback_reason`。

`_classifier_payload`构造分类侧审计记录。

记录内容包括模式、labels、probabilities、模型、cached、digest、signals、duration_ms、`fallback_reason`。

确定性信号集合记在两侧的记录里。

两个通道保持各自可审计。

即使只有一侧开着。

#### （11）`release_policy_parameters`方法

这个方法返回两侧的策略身份加组合策略。

包括`combine`和`combined`。

包括两侧各自的`release_policy_parameters()`。

凭据不出现在返回值里。

### 7、模块级辅助函数

`_request_failure`记录一次失败的judge请求。

它打warning日志。

日志带侧名和异常信息。

然后返回`request_failed=True`的`_SideOutcome`。

为什么在这里打日志。

审计记录是持久trace。

但端点不可达不能等评估报告才被发现。

所以发生时就打日志。

`_fallback_reason`回答"这一侧为什么没有裁决"。

`outcome.request_failed`为真就返回`REASON_REQUEST_FAILED`。

否则返回资格的reason，再不行就`REASON_NO_VERDICT`。

`request_failed`只会在实际发过请求的侧上设置。

不合格侧保留自己的原因。

即使这轮的请求失败了。

`_optional_str`处理身份字段。

`_prescreen_request`和`_signal_request`把上下文转成两侧的请求对象。

这两个函数延迟导入请求类型。

延迟导入是为了避免循环导入。

### 8、`build_memory_judge`函数

这个函数从宿主记忆配置构建judge。

全部侧都off时返回`None`。

`config`为`None`就用`get_memory_config()`。

函数先解析预筛。

用`prescreen_config`的mode、use、config。

函数再解析分类器。

用`signal_config`的mode、use、config。

两侧都是`None`就返回`None`。

否则构造`MemorySignalCoordinator`。

`combine`取自`signal_config.combine`。

返回`None`的含义是"没有配置判定"。

注入`None`后提取路径和没有这个功能的部署逐字节一致。

这是L1/S1的要求。

调用方把结果注入后端作为`judge`宿主钩子。

## （二）它和谁协作

### 1、它依赖谁

它依赖`deerflow.agents.memory.judging`的三个东西。

`AnswerCache`是答案缓存。

`CachedVerdict`是缓存桶值。

`batch_chars`和`batch_digest`是批次文本的字符计数和摘要哈希。

它依赖`prescreen.contract`的常量和类型。

包括`MODE_ENFORCE`、`VERDICT_SKIP`、`MemoryPrescreenDecision`、`MemoryPrescreenProvider`、`MODE_OFF`。

它依赖`signals.contract`的常量和类型。

包括`COMBINES`、`MODE_HINTS`、`MemorySignalDecision`、`MemorySignalProvider`、`MODE_OFF`。

它依赖`deerflow.typesafe.client`的三个类型。

`Answer`、`AnswerSet`、`Question`。

它依赖`deerflow.typesafe.errors`的`TypeSafeError`。

它在`build_memory_judge`里延迟导入两个解析函数和`get_memory_config`。

### 2、谁调用它

`signals`包的`__init__.py`重新导出本模块的四个公开成员。

DeerMem更新器通过`judge`宿主钩子调用协调器。

调用形式是`judge(context)`。

context是一个普通映射。

`build_memory_judge`被记忆层的装配代码调用。

调用时机是构建记忆管理器时。

装配代码把结果注入DeerMem后端。

`memory.prescreen`和`memory.signal_classification`配置变化时。

`get_memory_manager()`通过`MemoryManager.refresh_judge`重建并重新注入judge。

## 重要性评级

评级：8分。

理由分六点。

第一点，这个模块是整个记忆判定功能的中心。

预筛和信号分类两个插槽都通过它进入DeerMem。

没有它，两个侧无法协作。

第二点，三阶段流程（资格判定、缓存组装、消费）包含大量精细规则。

查缓存先于资格收窄。

逐答案的模型来源。

缓存命中和网络样本的区分。

这些规则直接影响shadow评估数据的正确性。

做错任何一条，评估结论就不可信。

第三点，失败语义的设计非常精细。

`request_failed`和`no_verdict`分开。

`fallback_reason`让"为什么没判"可审计。

失败永远是加法的。

这些保证了judge永远不会弄丢或挡住记忆。

第四点，否决路径（设计2.2.7）是模型裁决改变提取决定的唯一通道。

这条通道被严格限定在`enforce`乘`hints`乘阈值之上。

第五点，`_over_limit`坚持字符数不用字节数。

这个决定避免了中文文本被早三倍触发回退。

第六点，扣一分的原因是这个模块只在两个插槽都配置时才活跃。

默认部署完全不经过它。

再扣一分的原因是它有约600行。

逻辑密度高。

资格条件、缓存键、来源归因互相纠缠。

理解成本偏高。

改动时需要同时对照设计文档和多条不变量。
