# ReasoningCapabilities档案

一、这个类是干什么的

ReasoningCapabilities是单个模型的声明式推理能力契约配置类。对应issue #5073。这个类声明在旧的supports_thinking等布尔值旁边。这个类存在时那些布尔值由它推导。运行时规范化视图在deerflow.models.reasoning里。这个类继承自pydantic的BaseModel。extra为forbid。

二、类的成员

（一）字段

- thinking：字面量。取值是unsupported、optional或required。默认值是unsupported。这个字段表示思考能否切换、总是开启还是不可用。
- on_disable_request：字面量。取值是keep_enabled或reject。默认值是keep_enabled。required思考的模型专用。调用者要求关闭时保持开启或拒绝请求。
- dialect：字面量。取值是auto、openai_extra_body、anthropic、vllm_chat_template、ollama或none。默认值是auto。这个字段是序列化思考开关的载荷方言。
- history：字面量。取值是preserve、clear或None。默认值是None。这个字段表示推理历史跨轮次要保留还是清除。
- effort：ReasoningEffortCapabilities或None。默认值是None。这个字段是推理力度控制。省略表示模型不暴露力度。

（二）方法

- _reject_only_applies_to_required_thinking：模型校验器。这个方法确保on_disable_request为reject只在thinking为required时有意义。违反就报错。

三、它和谁协作

ModelConfig持有这个类。ModelConfig的reasoning字段的类型是这个类。ReasoningEffortCapabilities是effort字段的类型。ModelConfig的校验器用这个契约推导旧布尔值。deerflow.models.reasoning读取这个契约做规范化。

四、重要性评级

评级：6分。

理由：推理能力是模型选择和行为的核心契约。声明错误会导致参数错配。推导逻辑保证旧字段和新契约一致。所以重要性中等偏上。
