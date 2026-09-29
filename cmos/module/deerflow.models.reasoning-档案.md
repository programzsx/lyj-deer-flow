# deerflow.models.reasoning-档案

## 一、这个模块是干什么的

这个模块实现规范化的模型推理能力契约。对应issue #5073。

每个模型创建路径以前自己解释supports_thinking和supports_reasoning_effort。然后把通用的thinking_enabled和reasoning_effort值交给工厂。这样没法描述provider契约和通用假设不同的模型。required thinking。受限effort词汇。provider特定payload方言。

这个模块拥有单一规范化视图。resolve_reasoning_contract把任何profile转成不可变的ReasoningContract。resolve_reasoning_request把调用方的通用请求应用到契约。返回有效的thinking_enabled和provider effort值。reasoning_capabilities_payload为Gateway API和客户端投影契约。

## 二、模块里的主要成员

### 1、类型常量

ThinkingMode是unsupported、optional、required三种。

DisableRequestPolicy是keep_enabled或reject。

ReasoningDialect是auto、openai_extra_body、anthropic、vllm_chat_template、ollama、none。

ReasoningHistory是preserve或clear。

ContractSource是legacy或contract。

GENERIC_EFFORT_VALUES是minimal、low、medium、high。DeerFlow通用UI和按代理默认发出的词汇。遗留profile精确宣传这个集合。前端保持旧选项。

DEFAULT_EFFORT_PATH是reasoning_effort。OpenAI兼容客户端接受的构造关键字。

### 2、ReasoningPolicyError异常

请求和模型的推理契约矛盾。不能到达provider。

### 3、EffortContract数据类

一个模型允许的effort值。frozen dataclass。

values是允许值元组。default是默认值。aliases是别名映射。path是序列化路径。strict区分声明契约（未知值永不到达provider）和遗留投影（值原样转发）。

### 4、ReasoningContract数据类

一个模型profile的规范化推理能力。frozen dataclass。

thinking是ThinkingMode。effort是EffortContract或None。on_disable_request是DisableRequestPolicy。dialect是ReasoningDialect。history是ReasoningHistory或None。source是ContractSource。

三个属性。supports_thinking。thinking_required。supports_reasoning_effort。

### 5、ResolvedReasoning数据类

一次模型调用的有效策略。

thinking_enabled。reasoning_effort。adjustments列出契约对请求做了什么修改。thinking_unsupported。thinking_forced_on。effort_unsupported。effort_aliased。effort_unsupported_value。

### 6、resolve_reasoning_contract函数

把模型profile规范化成ReasoningContract。

接受真实的ModelConfig和duck-typed替身。子代理描述构建器和几个测试传SimpleNamespace或mock。只有真正的ReasoningCapabilities实例算声明契约。其他回退到遗留布尔。

声明契约。effort存在时构造EffortContract。values、default、aliases、path。strict=True。

遗留profile。从布尔派生。supports_thinking为True是optional。False是unsupported。supports_reasoning_effort为True时effort是GENERIC_EFFORT_VALUES加strict=False。False时effort是None。

### 7、resolve_reasoning_request函数

把通用请求应用到契约。

thinking unsupported时。请求开启也降级为False。adjustments记录thinking_unsupported。

thinking required时。请求关闭且on_disable_request为reject时抛ReasoningPolicyError。on_disable_request为keep_enabled时强制开启。adjustments记录thinking_forced_on。

optional时。直接用请求值。

effort处理。effort为None时。请求有值记effort_unsupported。有效的effort为None。

effort不strict时。直接用请求值。

effort strict时。请求为None用default。请求不是字符串记effort_unsupported_value用default。请求在values里直接用。请求在aliases里映射。记effort_aliased。其他记effort_unsupported_value用default。

### 8、reasoning_capabilities_payload函数

契约的JSON投影。为Gateway API和客户端。

包含thinking、effort、history、source。

## 三、它和谁协作

factory调用resolve_reasoning_contract和resolve_reasoning_request。create_chat_model是单一执行点。

主代理和子代理描述构建器解析同一策略。运行元数据报告有效值。

Gateway的models路由用reasoning_capabilities_payload。

它依赖config.model_config的ReasoningCapabilities。

## 四、重要性评级

评级是7分（满分10分）。

理由：

reasoning是模型推理能力的单一规范化视图。没有它。每个创建路径自己解释supports_thinking。没法描述provider契约和通用假设不同的模型。

契约的词汇设计细。thinking三种。effort的strict区分声明契约和遗留投影。aliases映射provider的拼写。path支持自定义effort wire格式。

resolve_reasoning_request的effort处理完整。None值、非字符串、值内、别名、其他。每条路径都有adjustments记录。

声明契约矛盾在配置加载时失败。required加when_thinking_disabled。unsupported加启用模板。

它是推理能力的中枢。给7分。
