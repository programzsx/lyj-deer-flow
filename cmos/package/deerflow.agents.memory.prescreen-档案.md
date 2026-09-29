# deerflow.agents.memory.prescreen-档案

## 一、这个包是干什么的

这个包是DeerFlow的"记忆捕获预筛查"包。

包名是`deerflow.agents.memory.prescreen`。源码在`backend/packages/harness/deerflow/agents/memory/prescreen/`。

大白话讲。记忆系统每次做事实提取都要调用一次LLM。但不是每一批对话都值得提取。有的批次全是寒暄和进度汇报，里面没有值得长期记住的东西。这个包回答一个问题。

"这一批对话值不值得花一次提取调用的钱？"

它是一个成本闸门。它绝不是安全边界。这个定位写在契约文档字符串里。它不拦截任何执行。它不拦截任何写入。它只决定"提取调用要不要花钱"。所有失败方向都是"照常提取"。

三种模式。

- `off`。关闭。默认关闭。解析器直接返回`None`，不解析类路径，不构造任何东西，不校验任何凭据。没配预筛查的部署行为和从前完全一样。
- `shadow`。影子模式。判定被记录，但不生效。照常提取。用来积累评估数据。
- `enforce`。强制模式。判定"跳过"时真的跳过提取调用。但`enforce`必须先通过影子评估的门。

它自带的适配器用TypeSafe（Jev）服务做判定。每批对话发一个"无利用"（noul）问题，在回合路径之外判定。

为什么这个钩子住在宿主而不是扩展里。契约文档字符串解释了原因。扩展API的记忆触点只有只读的事后观察者，扩展的贡献是fail-open的。对一个能影响写入的开关来说，那是错误的形状。

## 二、包里的主要成员

### 1、__init__.py

它从`contract`导入并重新导出全部公共符号。包括三种模式常量、两个判定常量、请求和判定数据类、提供者协议、解析函数。

### 2、contract.py

这个模块是预筛查的契约。

- `MODE_OFF`、`MODE_SHADOW`、`MODE_ENFORCE`。三种模式。
- `VERDICT_EXTRACT`、`VERDICT_SKIP`。两个判定。
- `CONFIGURATION_SOURCE`。配置来源标识，值是`memory.prescreen.config`。
- `MemoryPrescreenRequest`。一个批次，宿主看到的样子。
- `MemoryPrescreenDecision`。一个判定。
- `MemoryPrescreenProvider`。可插拔预筛查的协议。
- `resolve_memory_prescreen()`。解析配置的预筛查。

`MemoryPrescreenRequest`的字段。核心是`batch_text`和`digest`。`batch_text`就是提取器本来要发的文本（`format_conversation_for_update`的输出）。判定侧不引入第二次截断。已有的记忆、工具调用参数、被丢弃的消息永远不进请求。其余字段是身份和信号信息。`signals`是确定性的信号集合。`bypass_watermark`标记紧急冲刷。

`MemoryPrescreenDecision`的字段。`verdict`是"extract"或"skip"。`probability`是持久价值概率。`model`是提供判定的模型。`cached`标记判定是不是来自缓存。`reason`是原因说明。

`MemoryPrescreenProvider`协议有两个方法。

- `decide(request)`。同步方法。判定一个批次。返回判定，返回`None`表示"没意见"，请求级失败抛`TypeSafeError`。
- `release_policy_parameters()`。声明影响行为的参数，供组装身份用，凭据绝不进这个字典。

错误方向的区分很重要，写在协议文档字符串里。`None`是"没意见"（问题级失败，或没东西可判）。调用方把它当退化处理，照常提取。请求级失败必须抛`TypeSafeError`，这样这一轮的审计记录才能说`request_failed`，而不是"没判定"。其他异常是提供者的bug，调用方照常提取。

`resolve_memory_prescreen()`的解析规则。`off`模式直接返回`None`。什么都不构造。所以没配预筛查的部署不花任何成本，也不会在构建时失败。其他模式"大声失败"。类路径不可用或提供者拒绝配置时直接抛错。绝不静默退化成"没有预筛查"。静默退化会把部署错误藏在一个什么都不记录的行为背后。解析用`deerflow.reflection.resolve_variable`按类路径找类。找到后用`mode`加配置字典实例化。

### 3、typesafe.py

这个模块是TypeSafe（Jev）预筛查适配器。`TypeSafeMemoryPrescreen`类。

它是成本闸门的具体实现。方向和工具闸门相反。工具闸门里概率高就拒绝。这里概率低于`skip_threshold`才跳过。默认阈值是0.2。

它拥有的东西。判定的状态（格式化的批次文本，别的什么都不发）、问题和评分规则、`skip_threshold`、失败方向、自己的按`digest`键的缓存、服务模型版本的审计策略。

它不拥有的东西。传输、鉴权、重试、截止时间预算、响应校验。这些都归共享客户端`deerflow.typesafe`管。

默认的问题文本。问题是"这段对话里有没有持久的、跨任务的、用户级的信息值得提取进长期记忆？"判定文本本身。`true`的标准包括持久身份事实、长期偏好、长期目标、持久决策、对已有信息的显式纠正。`false`的标准包括任务内进度、寒暄、确认、对已说内容的复述、过程闲聊、只对当前结果的认可。

核心方法：

- `decide(request)`。契约的独立入口。先查自己的缓存。命中就直接解读。未命中就发请求，解读，把结果放回缓存。请求级失败不捕获，传播给协调器记录。注释说明失败在这里不写桶（失败不能被记住）。
- `interpret(answers, ...)`。把校验过的答案映射成判定。概率不是浮点数就返回`None`（没意见）。概率低于阈值判"skip"，否则判"extract"。
- `ask(batch_text, questions)`。通过自己的客户端发问题。发送前用`conversation_tail_state`取格式化文本。
- `questions()`。这一侧问的问题集合。
- `sharing_key()`。内部共享身份。包含凭据指纹、连接、限制、缓存。
- `release_policy_parameters()`。声明影响行为的参数。包括模式、连接公开参数、阈值、指令哈希、评分标准、状态字符上限、缓存设置。凭据不进。

`max_state_chars`默认6000。这是判定文本的字符数上限，每一侧各自执行自己的限制。超限的一侧退化。注意没有任何东西被截断来适配限制。

`mode`被记录但不改变这个类的行为。注释解释了原因。模式决定判定怎么被消费。shadow记录它，enforce对它行动。这个决定属于调用方。

## 三、它和谁协作

### 1、上游

- `deerflow.agents.memory.signals.coordinator`。协调器。判定配置在两边都启用时由协调器组合请求。协调器导入这个包的契约。
- `deerflow.agents.memory.manager`。工厂按判定配置的变化重建并注入判定器。工厂引用这个包的`CONFIGURATION_SOURCE`。
- `deerflow.config.memory_config`。配置schema里的`prescreen`字段。
- DeerMem更新器。通过记忆层的judge钩子消费这个契约。它是最终调用方。

### 2、下游

- `deerflow.typesafe`。共享客户端。负责传输、鉴权、重试、响应校验。
- `deerflow.agents.memory.judging`。共享件。`conversation_tail_state`取发送的文本。`AnswerCache`和`CachedVerdict`是缓存。
- `deerflow.reflection`。按类路径解析提供者类。
- `deerflow_extension_api`。`canonical_hash`给指令文本做哈希。
- TypeSafe（Jev）服务本身。

### 3、配置

配置写在config.yaml的`memory.prescreen`下。默认关闭。`use`字段是提供者的类路径，比如`deerflow.agents.memory.prescreen.typesafe:TypeSafeMemoryPrescreen`。配置是热重载的。判定配置的编辑会通过`MemoryManager.refresh_judge`热重载到缓存的管理器上，不需要重启。`enforce`改回`off`会停止跳过提取。`off`改成`shadow`会开始记录。

### 4、enforce的门

`enforce`不是随便配的。`scripts/eval_memory_prescreen.py`是enforce的前置证据。它需要至少200个被评审确认"确实不值得记"的跳过样本，还要有节省调用的证据。缺任何一项就是`INSUFFICIENT`。

### 5、测试

`backend/tests/test_memory_prescreen.py`测试预筛查和信号分类。它导入这个包的契约和`TypeSafeMemoryPrescreen`。`backend/tests/test_app_config_reload.py`测试判定配置的热重载，配置样例里用了这个包的类路径。

## 四、重要性评级

评级是5分。

理由如下。

这个包默认关闭。没配它时，它完全不参与运行，一个字节都不花。

它不在记忆的核心路径上。它是一个可选的成本优化。没有它，提取照常进行，功能完全一样。

但它有明确的价值。事实提取每次都要调用LLM。预筛查能跳过不值得提取的批次，省下真实的调用成本和token。

它的被引用情况。用Grep在全仓库搜`deerflow.agents.memory.prescreen`。排除清单文件后，引用它的有四处代码。信号协调器导入它的契约。记忆管理器引用它的配置来源。记忆配置schema引用它的类路径示例。加上测试文件`test_memory_prescreen.py`和`test_app_config_reload.py`，以及`config.example.yaml`的配置样例。

删除它会怎样。判定配置解析不出`use`的默认实现，配置了预筛查的部署会失败。默认部署什么都不变。信号协调器会失去预筛查那一侧的契约来源，编译报错。所以删除它需要连带改信号协调器。

为什么是5分不是4分。它不是纯可选的孤立件。它的契约被信号协调器直接依赖。它的热重载、失败方向区分（`request_failed`对`no_verdict`）、缓存设计都嵌进了记忆系统的运行逻辑。它是"成本闸门"这套机制的契约锚点。

为什么不是更高分。它默认关闭。它不决定任何记忆的存留。所有失败方向都是"照常提取"。关掉它，记忆系统照常工作，只是多花提取的钱。
