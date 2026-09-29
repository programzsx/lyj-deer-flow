# ModelConfig档案

一、这个类是干什么的

ModelConfig是单个模型的配置类。这个类描述一个模型的名字、提供者和模型名。这个类还携带推理能力和思考设置。这个类继承自pydantic的BaseModel。extra为allow。允许携带额外字段。

二、类的成员

（一）字段

- name：字符串。必填。这个字段是模型的唯一名字。
- request_admission：RequestAdmissionConfig或None。默认值是None。这个字段是可选的进程级RPM节流。
- display_name：字符串或None。这个字段是显示名。
- description：字符串或None。这个字段是模型描述。
- use：字符串。必填。这个字段是模型提供者的类路径。例如langchain_openai.ChatOpenAI。
- model：字符串。必填。这个字段是模型名。
- use_responses_api：布尔值或None。默认值是None。这个字段表示OpenAI调用是否走responses API。
- output_version：字符串或None。默认值是None。这个字段是结构化输出版本。
- supports_thinking：布尔值。默认值是False。这个字段表示模型是否支持思考。reasoning契约存在时由契约推导。
- supports_reasoning_effort：布尔值。默认值是False。这个字段表示模型是否支持推理力度。reasoning契约存在时由契约推导。
- reasoning：ReasoningCapabilities、布尔值或字符串或None。默认值是None。这个字段是声明式推理能力契约。布尔或字符串保留旧的提供者原生设置。
- when_thinking_enabled：字典或None。默认值是None。这个字段是思考开启时传给模型的额外设置。
- when_thinking_disabled：字典或None。默认值是None。这个字段是思考关闭时传给模型的额外设置。
- supports_vision：布尔值。默认值是False。这个字段表示是否支持视觉输入。
- context_window：整数或None。默认值是None。必须大于0。这个字段是总上下文窗口token数。用于UI实时上下文占比显示。也让基于比例的摘要触发器能为第三方模型解析阈值。
- stream_chunk_timeout：浮点数或None。默认值是None。这个字段是流式块之间的最大等待秒数。None用工厂默认。只对OpenAI兼容提供者生效。
- thinking：字典或None。默认值是None。这个字段是思考设置的快捷方式。会和when_thinking_enabled合并。

（二）方法

- _validate_reasoning_contract：模型校验器。这个方法提前失败于契约无法满足的组合。required思考不能配when_thinking_disabled。unsupported思考不能配思考设置。推导旧布尔值并检查是否与显式设置矛盾。还会检查各来源的effort值是否符合契约。

三、它和谁协作

AppConfig持有这个类。AppConfig的models字段是ModelConfig的列表。AppConfig的get_model_config方法用名字查找实例。ManagedModel的runtime_config方法构造ModelConfig。模型工厂读取这个实例创建langchain模型。

四、重要性评级

评级：8分。

理由：这个类是模型层的核心配置。代理用什么模型、怎么思考都由它决定。推理契约校验避免了静默错配。几乎所有请求都经过它。所以重要性高。
