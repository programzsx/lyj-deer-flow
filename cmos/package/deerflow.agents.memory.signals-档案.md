# deerflow.agents.memory.signals-档案

## 一、这个包是干什么的

这个包是DeerFlow的"记忆信号分类"包。

包名是`deerflow.agents.memory.signals`。源码在`backend/packages/harness/deerflow/agents/memory/signals/`。

大白话讲。记忆系统提取事实时，需要知道一段对话是在"强化"已有记忆，还是在"弱化"已有记忆。用户说"以后都用X"是在强化。用户说"别再用X了"是在纠正。这个包对一段对话批次给出强化或弱化的提示。

它的定位是"提示来源"。它从不决定提取。它从不驱动删除。它从不参与强化证据门。只有一个窄场景例外。

这个例外是"否决"。预筛查enforce乘以分类器hints时，模型提示可以否决一次跳过。也就是预筛查想说"跳过提取"，分类器说"这里有纠正信号"，那就照常提取。除此之外它只加提示文本。

三种模式。

- `off`。关闭。默认关闭。
- `shadow`。影子模式。提示被记录，但不生效。
- `hints`。提示模式。提示合并进提取的提示文本。否决也在这个模式下发生。

这个包的核心是协调器。协调器是记忆层的"判定器"。预筛查和信号分类两边要判定同一段文本。两边不能各自组装自己的请求。协调器拥有请求组合和组合缓存。两边共用一个判定入口。

## 二、包里的主要成员

### 1、__init__.py

它从`contract`和`coordinator`导入并重新导出全部公共符号。包括模式常量、组合策略常量、标签常量、请求和判定数据类、提供者协议、协调器、`build_memory_judge`。

### 2、contract.py

这个模块是信号分类的契约。

- `MODE_OFF`、`MODE_SHADOW`、`MODE_HINTS`。三种模式。
- `COMBINE_AUTO`、`COMBINE_ALWAYS`、`COMBINE_NEVER`。三种组合策略。决定这一侧的请求怎么和预筛查的关系。`auto`只在每个生效客户端设置都匹配时共享。`always`总是一个请求。`never`每侧一个请求。
- `LABEL_REINFORCEMENT`、`LABEL_CORRECTION`。两个标签。名字和确定性信号类对齐。
- `MemorySignalRequest`。一个批次。和预筛查用同一个数据面。
- `MemorySignalDecision`。提示标签。
- `MemorySignalProvider`。可插拔分类器的协议。
- `direction_labels()`。把两个方向的概率映射成标签。
- `resolve_memory_signal_classifier()`。解析配置的分类器。

`MemorySignalDecision`的字段。`labels`是提示标签集合。`probabilities`只带有校验过的方向。一个响应里只有一个可用方向时，那个方向照样贡献。失败按问题计数，不按侧计数。

`direction_labels()`的映射规则是固定的。`affirmation >= hint_threshold`给`reinforcement`标签。`negation >= hint_threshold`给`correction`标签。两个标签可以同时成立。"继续用X，但别再用Y"就是两个都有。

`MemorySignalProvider`协议的规则和预筛查一样。`decide`是同步方法。`None`是"没有模型结果"。请求级失败抛`TypeSafeError`。

这个侧是"只加不改"的。契约文档字符串写得很清楚。模型判定可以加提示文本，可以在预筛查enforce乘分类器hints时否决一次跳过。它绝不自己决定提取，绝不驱动删除，绝不参与强化证据门。

`resolve_memory_signal_classifier()`的规则和预筛查的解析器一样。`off`什么都不解析、不构造、不校验。其他模式大声失败，绝不静默退化。

### 3、coordinator.py

这个模块是记忆层的判定器。`MemorySignalCoordinator`类。这是DeerMem更新器调用的唯一对象。

为什么需要协调器。文档字符串解释了原因。两边不能各自组装自己的请求。协调器分三个阶段工作。

第一阶段是每侧的资格判断。每侧独立决定这一轮能不能判定。预筛查可以因为分类器没有共享的原因不合格（确定性信号、陈旧审查、合并）。两侧在紧急冲刷和关闭排空路径上都不合格。

第二阶段是缓存和组装。先按共享身份和这一轮的完整逻辑问题集查缓存。减去缓存已有的。然后按组合策略分组。查询先于资格判断的收窄。某一轮只有一侧合格时，那一侧已分桶的答案照样复用，不用重新问。全命中就什么都不发。

第三阶段是消费。模式决定结果是什么意思。预筛查shadow记录，enforce跳过。分类器shadow记录，hints合并。唯一的例外是否决。预筛查enforce乘分类器hints乘一个达到阈值的模型提示时，改成提取而不是跳过。

失败永远是加性的。一侧没结果就不贡献。同一响应里另一侧校验过的答案照样被消费。调用方退回自己的确定性行为。

重要成员：

- `MemoryBatchContext`。更新器调用判定器时知道的批次信息。包括文本、摘要、信号、陈旧审查开关、合并开关、紧急冲刷标记。
- `MemoryBatchVerdict`。更新器该做什么，加审计负载。`skip`是生效决策。被否决的跳过到达时是`skip=False`加`vetoed_by_model_signal=True`。`hints`是模型提示标签。`payload`是审计记录。
- `CombinablePrescreen`、`CombinableClassifier`。能共享请求的两侧协议。要求暴露`questions()`、`ask()`、`interpret()`、`sharing_key()`和缓存设置。
- `build_memory_judge()`。从宿主记忆配置构建判定器。两侧都关时返回`None`。`None`意味着"没配判定"，提取路径和不配这个功能的部署字节相同。

失败原因常量有八个。`disabled`、`shutdown_drain`、`emergency_flush`、`deterministic_signals`、`staleness_or_consolidation`、`over_limit`、`request_failed`、`no_verdict`。

`request_failed`和`no_verdict`是两个不同的人群。文档字符串解释了原因。请求到达不了端点（传输失败、非200、响应不可用、超时）不能读成"提供者回答了但没说出可用的东西"。适配器的`decide()`传播`TypeSafeError`而不是吞掉。协调器记录原因并记警告。更新器照常提取。`no_verdict`留给问题级失败。只有真正发过请求的一侧才能报`request_failed`。不合格的一侧保留自己的原因。

预筛查的资格判断顺序是固定的。禁用、关闭排空、紧急冲刷、确定性信号、陈旧审查或合并、超限。每一轮的审计记录都带退化原因。"为什么这批没被判定"始终可审计。

组合缓存的键是共享身份加完整逻辑问题集加批次摘要。每个答案带服务它的模型。部分答案的桶不算命中。缺的问题这一轮重新问。每次问到的答案合并进同一个桶。

`max_state_chars`是每侧自己的字符数限制。判定文本的字符数。不是字节数。注释解释了原因。共享客户端按UTF-8字节数计。字节数在中文文本上会提前三倍触发退化。

## 三、它和谁协作

### 1、上游

- `deerflow.agents.memory.manager`。工厂调用`build_memory_judge()`构建判定器。工厂在判定配置变化时重建并注入。工厂引用这个包的`CONFIGURATION_SOURCE`。
- `deerflow.config.memory_config`。配置schema里的`signal_classification`字段。
- DeerMem更新器。把批次交给协调器，消费返回的`MemoryBatchVerdict`。它是最终调用方。
- `deerflow.agents.memory.prescreen`。预筛查契约是协调器组合请求的另一侧。

### 2、下游

- `deerflow.typesafe`。共享客户端。两个适配器都用它做传输、鉴权、重试、响应校验。
- `deerflow.agents.memory.judging`。共享件。`batch_digest()`、`conversation_tail_state()`、`AnswerCache`、`CachedVerdict`。
- `deerflow.reflection`。按类路径解析分类器类。
- `deerflow_extension_api`。`canonical_hash`给指令文本做哈希。
- TypeSafe（Jev）服务本身。

### 3、配置

配置写在config.yaml的`memory.signal_classification`下。默认关闭。`use`字段是分类器的类路径，比如`deerflow.agents.memory.signals.typesafe:TypeSafeSignalClassifier`。`combine`字段决定请求组合策略。配置是热重载的。判定配置的编辑通过`MemoryManager.refresh_judge`热重载到缓存的管理器上。

### 4、hints模式的门

`hints`模式和预筛查的`enforce`是两个不同的门。信号分类设计第6节要求hints有自己的独立人工评审数据集、预注册的阈值、分层样本量。`eval_memory_prescreen.py`测不到这些。通过它的门只批准`enforce`。`hints`在第6节的证据出现之前保持关闭或影子模式。

### 5、测试

`backend/tests/test_memory_prescreen.py`测试协调器和分类器。它导入`MemoryBatchContext`、`MemorySignalCoordinator`、契约和`TypeSafeSignalClassifier`。测试验证热重载、否决、缓存归属。`backend/tests/test_app_config_reload.py`测试判定配置的热重载。

## 四、重要性评级

评级是5分。

理由如下。

这个包默认关闭。两侧都配`off`时，`build_memory_judge()`返回`None`，提取路径和不配这个功能的部署字节相同。

它不在记忆的核心路径上。它只加提示文本。所有失败方向都是"退回确定性行为"。关掉它，记忆系统照常工作。

但它不是孤立的。它的协调器是记忆层判定的唯一入口。工厂直接调用`build_memory_judge()`。预筛查契约被协调器依赖。它嵌在记忆系统的运行逻辑里。

它的被引用情况。用Grep在全仓库搜`deerflow.agents.memory.signals`。排除清单文件后，引用它的有四处代码。记忆管理器导入`build_memory_judge`和`CONFIGURATION_SOURCE`。加上测试文件`test_memory_prescreen.py`和`test_app_config_reload.py`，以及`config.example.yaml`的配置样例。

删除它会怎样。记忆管理器的`_host_default_judge()`导入`build_memory_judge()`会编译报错。判定器机制整体消失。默认部署的功能不变，因为默认本来就是关的。但配置了预筛查或信号分类的部署会启动失败，而且热重载机制失去作用对象。

为什么是5分不是4分。它是判定机制的入口和协调中枢。工厂依赖它。预筛查契约依赖它。它拥有组合缓存、否决逻辑、失败原因体系这些精密的运行逻辑。删除它需要连带改记忆管理器。

为什么不是更高分。它默认关闭。它从不决定提取，从不驱动删除。它的所有失败方向都是加性的。关掉它，记忆系统照常工作，只是少了模型提示。
