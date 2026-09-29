# 模块档案：deerflow.agents.memory.signals.typesafe

## 一、这个模块是干什么的

这个模块是Jev信号分类的TypeSafe实现。

这个模块对每批对话提出两个独立的"noul"问题。

第一个问题是这段对话是否显式认可了用户之前说过的偏好。

认可的对象可以是用户级偏好、约束或做法。

第二个问题是这段对话是否显式拒绝或反转了用户之前说过的偏好。

两个问题的答案被映射成确定性标签。

认可映射成`reinforcement`标签。

拒绝映射成`correction`标签。

映射规则来自设计文档第5节。

这个适配器拥有四样东西。

第一样是两个问题文本和它们的评分标准。

第二样是`hint_threshold`阈值。

第三样是标签映射。

第四样是自己的`digest`键控缓存。

还有已服务模型版本的审计策略。

这个模块的定位是"只加不决"。

这个模块不决定提取。

这个模块不驱动删除。

它只给提示。

提示在协调器的消费阶段被决定怎么用。

## （一）模块里的主要成员

### 1、问题定义常量

`QUESTION_AFFIRMATION`等于`"signal_affirmation"`。

这是认可问题的标识。

`QUESTION_NEGATION`等于`"signal_negation"`。

这是否定问题的标识。

默认的认可指令问的是这段对话是否显式认可了用户之前说的偏好、约束或做法。

默认指令同样要求只看文本本身。

认可的"为真"标准举例是"继续用X"、"那个做法是对的，保持下去"。

认可的"为假"标准明确说明对当前任务、结果或文件的认可不算。

否定的"为真"标准举例是"别再用X"、"不对，换个方式做"。

否定的"为假"标准明确说明对当前任务、结果或文件的批评不算。

这个"当前结果不算"的限定很重要。

模型容易把"这次做得好"误判成对长期偏好的认可。

标准文本直接把这种情况排除。

`DEFAULT_HINT_THRESHOLD`等于`0.5`。

方向概率达到`0.5`才产生标签。

`DEFAULT_MAX_STATE_CHARS`等于`6000`。

判定文本超过`6000`个字符这一侧回退。

### 2、`TypeSafeSignalClassifier`类

这个类是本模块的核心。

这个类的`name`是`"typesafe"`。

这个类的`policy_id`是`"deerflow.memory.signals.typesafe"`。

这个类的`policy_version`是`"1.0.0"`。

这个类的`mode`只记录不改变行为。

模式决定标签是被消费、只记录还是被忽略。

这个决定属于调用方。

属于设计文档第2.2.4节。

#### （1）构造函数

构造函数的参数结构和预筛实现非常相似。

连接参数包括`api_key`、`api_key_env`、`base_url`、`model`。

超时和重试参数包括`timeout`、`deadline_seconds`、`max_attempts`、`retry_backoff`。

行为参数包括`mode`、`hint_threshold`、`instructions`、`criteria`、`max_state_chars`。

缓存参数包括`cache_size`、`cache_ttl_seconds`。

还有`transport_factory`用于测试注入。

构造函数先校验`mode`。

然后通过`resolve_connection`解析连接。

配置来源是`CONFIGURATION_SOURCE`。

然后用连接构造`TypeSafeClient`。

然后校验`hint_threshold`。

范围是`0.0`到`1.0`。

然后构造两个`_QuestionText`。

每个方向一份文本。

每个方向有三段文本。

这三段是指令、为真标准、为假标准。

覆盖规则是没提供就用默认文本。

覆盖可以按问题ID给。

也可以按方向名给。

`_instructions`辅助函数处理指令覆盖的查找。

`_side_criteria`辅助函数处理标准覆盖的查找。

`_side_criteria`还会校验criteria的结构。

criteria不是映射或条目不是映射都抛`ValueError`。

最后构造问题字典和`AnswerCache`。

问题字典有两个问题。

两个问题的类型都是`QUESTION_NOUL`。

#### （2）侧接口方法

`questions()`返回这一侧的两个问题。

`ask(batch_text, questions)`通过这一侧的客户端发送问题。

发送前用`conversation_tail_state`包装批次文本。

`sharing_key(**dimensions)`返回内部共享身份。

#### （3）`interpret`方法

这个方法把校验过的答案映射成提示标签。

先取认可方向的概率。

再取否定方向的概率。

`_probability`辅助函数处理取值。

概率不是浮点数就当`None`。

两个方向都是`None`就返回`None`。

`None`表示"两个方向都不可用"。

只有一个方向可用时这个方向照常贡献。

失败按问题计数。

失败不按侧计数。

这是设计文档S7/S18的要求。

可用方向进入`probabilities`映射。

然后调用`direction_labels`计算标签。

阈值是`self.hint_threshold`。

最后返回`MemorySignalDecision`。

`model`经过`recordable_model`缩减。

`cached`透传。

#### （4）`release_policy_parameters`方法

这个方法声明影响行为的参数。

返回内容里有`mode`。

返回内容里有连接的公开参数。

返回内容里有`hint_threshold`、`max_state_chars`、缓存参数。

两个方向的指令文本各带一个`canonical_hash`。

标准文本原样放进身份。

凭据永远不会出现在返回值里。

#### （5）`decide`方法

这个方法是合同的独立入口。

这个方法用这一侧自己的缓存分类一个批次。

这是单侧路径。

`decide`先查缓存。

缓存键是`request.digest`。

有缓存就把答案和模型复制出来。

`missing`是还没有答案的问题。

`missing`为空就是完整命中。

完整命中直接interpret，标记`cached=True`。

`missing`非空就发送缺失的问题。

拿到答案后合并进答案和模型映射。

有新验证的答案就写回缓存桶。

这时判定包含一个网络样本。

判定报告本轮服务的模型。

标记`cached=False`。

没有新验证的答案就只靠桶里已有的答案判定。

这时判定报告桶里已有答案的模型。

标记`cached=True`。

为什么这样处理。

一次重试可能什么有效答案都没返回。

重试没有提供任何被消费的证据。

所以判定要归因到桶里已有的答案的模型。

不能归因到空响应的模型。

这个细节直接影响审计的正确性。

### 3、`_QuestionText`类

这个类保存一个问题方向的可配置文本。

这个类有`__slots__`。

这个类有三个字段。

字段是`instructions`、`true`、`false`。

## （二）它和谁协作

### 1、它依赖谁

它依赖`deerflow.agents.memory.judging`的三个东西。

`AnswerCache`、`CachedVerdict`、`conversation_tail_state`。

它依赖`deerflow.typesafe.client`的六个东西。

`QUESTION_NOUL`、`Answer`、`Question`、`TransportFactory`、`TypeSafeClient`、`recordable_model`。

它依赖`deerflow.typesafe.connection`的三个东西。

`TypeSafeConnection`、`resolve_connection`、`typesafe_defaults`。

它依赖`deerflow.typesafe.validation`的四个校验函数。

它依赖`signals.contract`的全部合同成员。

包括`direction_labels`。

它还延迟导入`deerflow_extension_api`的`canonical_hash`。

### 2、谁调用它

`signals/coordinator.py`里的`build_memory_judge`通过`resolve_memory_signal_classifier`按类路径构造这个类。

构造之后这个类作为`MemorySignalCoordinator`的分类器侧被调用。

协调器在单侧路径调用`decide`。

协调器在合并路径通过`CombinableClassifier`协议调用`questions`、`ask`、`interpret`、`sharing_key`。

协调器还读取它的`max_state_chars`、`cache_size`、`cache_ttl_seconds`属性。

DeerMem更新器通过judge钩子间接消费这个类的提示标签。

`backend/docs/MEMORY_IMPROVEMENTS.md`记录了模式语义和`hints`单独的证据要求。

## 重要性评级

评级：5分。

理由分四点。

第一点，这个模块是信号分类合同的默认实现。

它把两个"noul"问题落实成具体逻辑。

第二点，这个模块对"部分答案"的处理很精细。

一个方向失败不影响另一个方向。

重试无有效答案时归因到桶里已有的模型。

这些细节保证审计数据正确。

第三点，这个模块的提示被设计成"只加不决"。

模型标签永远不能直接写确认。

这个约束由上游协调器执行。

这个模块自己也不越界。

第四点，扣分的原因有三个。

第一个原因是这个功能默认关闭。

第二个原因是这个模块是合同的一个薄适配层。

核心逻辑量比协调器小得多。

第三个原因是提示本身只影响提取文本里的提示union。

提示的最终效果被多层闸门限制。

影响面有限。
