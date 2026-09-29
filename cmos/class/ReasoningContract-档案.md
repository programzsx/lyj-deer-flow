# ReasoningContract-档案.md

源文件位置。

这个类定义在`backend/packages/harness/deerflow/models/reasoning.py`。

## 一、这个类是干什么的

ReasoningContract是一个数据类。

这个类是"一个模型配置的归一化推理能力视图"。

docstring原话是"Normalized reasoning capabilities of one model profile"。

意思是"一个模型配置的归一化推理能力"。

先讲这个类解决什么问题。

这个问题的背景在模块docstring里写得很清楚。

模块docstring说这是issue #5073的产物。

以前DeerFlow里每一条模型创建路径都要自己解释`supports_thinking`和`supports_reasoning_effort`这两个布尔值。

模型创建路径很多。

路径包括主agent、子agent、摘要生成、标题生成、一次性工具。

每条路径自己解释。

然后各自把通用的`thinking_enabled`和`reasoning_effort`值交给模型工厂。

这种做法有一个致命缺陷。

有些模型的服务商契约和通用假设不一样。

契约差异有好几种。

差异一。有的模型强制要求开思维链。

差异二。有的模型的推理强度取值受限。

差异三。有的服务商有自己专属的请求格式。

通用假设覆盖不了这些差异。

所以需要"单一归一化视图"。

ReasoningContract就是这个视图。

所有模型创建路径先拿到同一个契约。

再按契约决定行为。

这样解释逻辑只有一份。

不会每条路径各说各话。

### 契约怎么来的

契约有两种来源。

`source`字段标记来源。

来源一。`legacy`。

模型配置没有声明`reasoning:`契约。

系统从旧的布尔值推导契约。

来源二。`contract`。

模型配置显式声明了`reasoning:`契约。

系统按声明1:1映射。

## 二、类的成员

这个类是`@dataclass(frozen=True)`装饰的不可变数据类。

### 字段`thinking`

类型是`ThinkingMode`。

`ThinkingMode`是字面量类型。

取值有三种。

取值一。`unsupported`。

这个模型不支持思维链。

取值二。`optional`。

这个模型可选开思维链。

取值三。`required`。

这个模型强制要求开思维链。

### 字段`effort`

类型是`EffortContract | None`。

这个字段描述该模型的推理强度契约。

None表示该模型不支持推理强度设置。

非None时是一个EffortContract实例。

EffortContract描述允许的取值、默认值、别名表、序列化路径、是否严格校验。

### 字段`on_disable_request`

类型是`DisableRequestPolicy`。

默认是`"keep_enabled"`。

取值有两种。

取值一。`keep_enabled`。

调用方请求关思维链。

系统悄悄保持开启。

取值二。`reject`。

调用方请求关思维链。

系统抛出ReasoningPolicyError。

这个字段只在`thinking`为`required`时有意义。

### 字段`dialect`

类型是`ReasoningDialect`。

默认是`"auto"`。

这个字段指定推理开关的请求格式方言。

取值有六种。

分别是`auto`、`openai_extra_body`、`anthropic`、`vllm_chat_template`、`ollama`、`none`。

`auto`表示从配置的`when_thinking_enabled`模板自动推断。

### 字段`history`

类型是`ReasoningHistory | None`。

默认是None。

取值有两种。`preserve`和`clear`。

这个字段声明该模型对推理历史的处理要求。

### 字段`source`

类型是`ContractSource`。

默认是`"legacy"`。

标记契约来源。两种取值。`legacy`和`contract`。

### 属性`supports_thinking`

无输入。输出布尔值。

判断逻辑是`thinking != "unsupported"`。

模型支持思维链就返回True。

### 属性`thinking_required`

无输入。输出布尔值。

判断逻辑是`thinking == "required"`。

模型强制思维链就返回True。

### 属性`supports_reasoning_effort`

无输入。输出布尔值。

判断逻辑是`effort is not None`。

模型支持推理强度就返回True。

这三个属性存在的意义是兼容旧代码。

旧代码到处检查`supports_thinking`。

归一化之后。

这些检查可以统一走契约的属性。

## 三、它和谁协作

### 被谁创建

`resolve_reasoning_contract`函数创建ReasoningContract。

这个函数在同一个文件里。

函数接受一个模型配置。

模型配置可以是真实的`ModelConfig`。

也可以是鸭子类型的替身。

子agent描述构建器和一些测试会传`SimpleNamespace`或mock。

只有真正的`ReasoningCapabilities`实例才算"声明式契约"。

其他都回退到遗留布尔值。

### 被谁使用

第一。`resolve_reasoning_request`函数消费契约。

这个函数把调用方的通用请求应用到契约上。

产出`ResolvedReasoning`。

这是工厂和所有调用方共享的唯一策略。

第二。`reasoning_capabilities_payload`函数消费契约。

这个函数把契约投影成JSON结构。

投影结果用于Gateway的`/api/models`响应。

也用于`DeerFlowClient`。

### 被谁持有

模型工厂`create_chat_model`在构建模型时先解析出契约。

工厂按契约决定思维链开关和强度值怎么进请求。

### 继承关系

这个类是纯dataclass。

这个类不继承任何业务类。

### 关联配置

声明式契约的配置来自`deerflow.config.model_config.ReasoningCapabilities`。

## 四、重要性评级

评级是7分。

理由如下。

第一点。

这个类是模型推理能力体系的中心。

所有模型创建路径共享这一个视图。

模块docstring明确说"This module owns the single normalized view"。

意思是"这个模块持有唯一的归一化视图"。

第二点。

这个类解决了真实的架构问题。

归一化之前。

每条路径自己解释推理能力。

行为可能不一致。

归一化之后。

解释逻辑只有一份。

第三点。

如果删掉这个类。

推理能力体系完全瓦解。

`resolve_reasoning_contract`和`resolve_reasoning_request`都没有返回类型了。

模型工厂没法统一执行推理策略。

强制思维链模型、受限强度模型、自定义方言模型全部失效。

第四点。

这个类的使用面广。

工厂、Gateway API、客户端、所有调用方都间接依赖它。

第五点。

这个类本身是数据载体。

行为逻辑在配套函数里。

数据类本身的重要性取决于使用广度。

使用广度很高。

综合以上。

这是一个核心数据结构类。

评级7分。
