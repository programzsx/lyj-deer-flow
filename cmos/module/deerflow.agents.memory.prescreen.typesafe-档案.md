# 模块档案：deerflow.agents.memory.prescreen.typesafe

## 一、这个模块是干什么的

这个模块是记忆预筛的TypeSafe（Jev）实现。

这个模块对每批对话提出一个"noul"问题。

这个问题在回合路径之外被判定。

这个问题是"这批对话里有值得长期记住的内容吗"。

这个模块是一个成本闸门。

这个模块回答"这批对话值得花一次提取调用吗"。

这个模块只能省调用。

这个模块不拦截执行。

这个模块不拦截写入。

这个模块的所有失败模式都等于"照常提取"。

这里有一个方向上的关键差异。

工具闸门的方向是概率高就拒绝。

预筛的方向相反。

预筛是概率低于`skip_threshold`才跳过。

概率不低于阈值就照常提取。

这个适配器拥有五样东西。

第一样是状态。

状态就是格式化后的批次文本。

状态只有这个，没有别的。

第二样是问题文本和它的评分标准。

第三样是`skip_threshold`阈值。

第四样是失败方向。

第五样是自己的`digest`键控缓存。

第五样还有已服务模型版本的审计策略。

运输、认证、重试、超时预算和响应校验都不是这个模块的。

这五样全部属于共享客户端`deerflow.typesafe`。

这个模块只负责"问什么、怎么判、怎么映射成裁决"。

## （一）模块里的主要成员

### 1、问题定义常量

`QUESTION_ID`等于`"memory_worth_keeping"`。

这个字符串是这一侧唯一问题的标识。

默认指令是`_DEFAULT_INSTRUCTIONS`。

默认指令问的是这段对话是否包含持久的、跨任务的、用户级的信息。

默认指令还要求只看文本本身。

默认的"为真"标准是`_DEFAULT_CRITERIA_TRUE`。

为真标准列出了五种情况。

第一种是持久的身份事实，比如角色、职业、背景。

第二种是长期偏好、工作风格或稳定约束。

第三种是长期目标。

第四种是跨无关任务仍然有用的持久决定或工作模式。

第五种是对已有用户级信息的显式纠正。

为真标准还声明这些情况优先于为假标准。

默认的"为假"标准是`_DEFAULT_CRITERIA_FALSE`。

为假标准列出了任务本地进展、问候语、过程 chatter、只对当前结果的认可、相对已有陈述没有新内容。

这些情况不算值得记忆。

`DEFAULT_SKIP_THRESHOLD`等于`0.2`。

概率低于`0.2`就跳过提取。

`DEFAULT_MAX_STATE_CHARS`等于`6000`。

判定文本超过`6000`个字符这一侧就回退。

### 2、`TypeSafeMemoryPrescreen`类

这个类是本模块的核心。

这个类实现了预筛合同。

这个类的`name`是`"typesafe"`。

这个类的`policy_id`是`"deerflow.memory.prescreen.typesafe"`。

这个类的`policy_version`是`"1.0.0"`。

这个类的`mode`只记录不改变行为。

这一点很重要。

模式决定裁决"怎么被消费"。

`shadow`模式是记录。

`enforce`模式是生效。

这个消费决定属于调用方。

不属于这个类。

所以这个类把`mode`记进策略身份，但行为不因模式而变。

#### （1）构造函数

构造函数接受很多参数。

连接参数包括`api_key`、`api_key_env`、`base_url`、`model`。

超时和重试参数包括`timeout`、`deadline_seconds`、`max_attempts`、`retry_backoff`。

行为参数包括`skip_threshold`、`instructions`、`criteria`、`max_state_chars`。

缓存参数包括`cache_size`、`cache_ttl_seconds`。

还有`transport_factory`用于测试注入。

构造函数先校验`mode`。

`mode`不在`MODES`里就抛`ValueError`。

然后通过`resolve_connection`解析连接。

连接设置和`typesafe_defaults()`默认值合并。

配置来源标识是`CONFIGURATION_SOURCE`。

然后用连接构造`TypeSafeClient`。

然后逐项校验行为参数。

`skip_threshold`用`finite_float`校验。

校验范围是`0.0`到`1.0`。

`instructions`和criteria用`defaulted_text`校验。

没提供就用默认文本。

`max_state_chars`用`whole_number`校验。

最小值是`1`。

缓存参数同样校验。

最后构造问题字典和`AnswerCache`。

问题字典只有一个问题。

问题的类型是`QUESTION_NOUL`。

问题带指令和true/false两条评分标准。

#### （2）侧接口方法

`questions()`返回这一侧要问的问题。

批次文本由`ask`或协调器添加。

`ask(batch_text, questions)`通过这一侧的客户端发送问题。

发送前先用`conversation_tail_state(batch_text)`包装批次文本。

`sharing_key(**dimensions)`返回内部共享身份。

共享身份包括凭据指纹、连接、限制和缓存。

#### （3）`interpret`方法

这个方法把校验过的答案映射成裁决。

这个方法先取`memory_worth_keeping`问题的答案。

答案的概率不是浮点数就返回`None`。

`None`表示"这批对话没有意见"。

问题级失败永远不是错误。

调用方照常提取。

概率是浮点数就做比较。

概率小于`skip_threshold`就给`VERDICT_SKIP`。

概率不低于阈值就给`VERDICT_EXTRACT`。

然后构造`reason`字符串。

`reason`记录了概率、比较符号和阈值。

最后返回`MemoryPrescreenDecision`。

`model`经过`recordable_model`缩减。

`cached`透传。

#### （4）`release_policy_parameters`方法

这个方法声明影响行为的参数。

这些参数用于组装身份。

返回内容里有`mode`。

返回内容里有连接的公开参数。

返回内容里有`skip_threshold`、`max_state_chars`、缓存参数。

指令文本经过`canonical_hash`变成哈希。

这样做的目的是避免把完整提示词塞进身份记录。

凭据永远不会出现在返回值里。

#### （5）`decide`方法

这个方法是合同的独立入口。

这个方法用这一侧自己的缓存判定一个批次。

这是单侧路径。

单侧路径指这一侧是唯一启用的侧。

或者部署无法合并请求。

`decide`先查缓存。

缓存键是`request.digest`。

命中就直接interpret，标记`cached=True`。

未命中就调用`self._client.ask`发送问题。

这里故意没有try/except。

运输失败由协调器负责记录。

这一侧不写桶。

失败不能被记住。

拿到答案后interpret。

判定有意见就放进缓存。

缓存值是`CachedVerdict`。

`CachedVerdict`带每个问题的答案和模型。

判定没有意见就不缓存。

### 3、辅助成员

模块顶部还有两个默认标准文本常量。

这两个常量在构造函数里被引用。

## （二）它和谁协作

### 1、它依赖谁

它依赖`deerflow.agents.memory.judging`的三个东西。

第一个是`AnswerCache`。

这是摘要键控的答案缓存。

第二个是`CachedVerdict`。

这是缓存桶里存的值。

第三个是`conversation_tail_state`。

这是把批次文本包装成判定状态的函数。

它依赖`deerflow.typesafe.client`的六个东西。

`QUESTION_NOUL`是问题类型。

`Answer`和`Question`是数据类型。

`TransportFactory`是传输工厂类型。

`TypeSafeClient`是共享客户端。

`recordable_model`把模型版本缩减成可记录形式。

它依赖`deerflow.typesafe.connection`的三个东西。

`TypeSafeConnection`是连接对象。

`resolve_connection`解析连接设置。

`typesafe_defaults`提供默认值。

它依赖`deerflow.typesafe.validation`的四个校验函数。

这四个函数是`criteria_entry`、`defaulted_text`、`finite_float`、`whole_number`。

它还依赖`prescreen.contract`的全部合同成员。

它还在`release_policy_parameters`里延迟导入`deerflow_extension_api`的`canonical_hash`。

延迟导入是为了避免包根的重量级导入。

### 2、谁调用它

`signals/coordinator.py`里的`build_memory_judge`通过`resolve_memory_prescreen`按类路径构造这个类。

构造之后这个类作为`MemorySignalCoordinator`的预筛侧被调用。

`MemorySignalCoordinator`在单侧路径调用`decide`。

`MemorySignalCoordinator`在合并路径通过`CombinablePrescreen`协议调用`questions`、`ask`、`interpret`、`sharing_key`。

协调器还读取它的`max_state_chars`、`cache_size`、`cache_ttl_seconds`属性。

DeerMem更新器通过judge钩子间接消费这个类的裁决。

## 重要性评级

评级：6分。

理由分四点。

第一点，这个模块是预筛合同的默认实现。

没有实现，合同就只是纸面声明。

第二点，这个模块把"成本闸门"的方向落实成了具体逻辑。

概率低于阈值才跳过。

这个方向和工具闸门相反。

做反了会导致大量误跳过。

第三点，这个模块精心处理了缓存和审计的细节。

判定有意见才缓存。

失败不缓存。

模型版本经过`recordable_model`缩减。

这些细节直接影响shadow评估数据的正确性。

第四点，扣分的原因有两个。

第一个原因是这个功能默认关闭。

第二个原因是这个模块本质上是合同的一个薄适配层。

核心的运输、缓存基础设施都在`deerflow.typesafe`和`judging`模块里。

这个模块自己的逻辑量有限。
