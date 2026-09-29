# deerflow.models.factory-档案

## 一、这个模块是干什么的

这个模块是模型工厂。create_chat_model从配置创建LangChain聊天模型实例。

它是所有模型创建路径的唯一入口。主代理。子代理。摘要。标题生成。一次性工具。全部经过这里。

它做很多事。反射解析模型类。剥离元数据字段。应用推理契约。应用思考payload。规范化OpenAI别名。注入流超时默认。注入stream_usage默认。翻译上下文窗口。注入请求准入限流器。附加追踪回调。

## 二、模块里的主要成员

### 1、_MODEL_METADATA_FIELDS

这是一个frozenset。列出描述profile的ModelConfig字段。不是配置provider客户端的字段。构造函数看到profile之前剥离。

字段包括use、name、display_name、description、supports_thinking、supports_reasoning_effort、reasoning、when_thinking_enabled、when_thinking_disabled、thinking、supports_vision、context_window、pricing、request_admission。

这些字段到构造函数的话。provider客户端不认识它们。要么报错要么转发到请求载荷。

### 2、_deep_merge_dicts函数

递归合并两个字典。不改变输入。

override里的字典值深拷贝。不别名。override通常是缓存的ModelConfig的模板。共享引用会泄漏一次调用的调整到那次create_chat_model的每次调用。

### 3、_merge_settings函数

把payload深合并进构造设置。原地。

嵌套字典（extra_body、thinking、chat_template_kwargs）递归合并。合成的思考块不会清掉操作员放旁边的无关键。比如GLM的extra_body.tool_stream。

模板值被深拷贝。

### 4、_merge_thinking_payload函数

深合并思考开关payload。保持vLLM开关权威。

键从不移除。模板只能加或覆盖。配置的无关extra_body、chat_template_kwargs条目在两个方向都存活。

vLLM开关有两个拼写。_VLLM_THINKING_SWITCHES。遗留thinking别名。enable_thinking。vLLM的Qwen推理解析器读enable_thinking。配置和payload拼写不同时。payload声明的值镜像到另一个拼写。两个键一致。VllmChatModel合并成enable_thinking。普通OpenAI兼容类发送两个。服务器看到payload的意图不管它认哪个名字。不发明拼写。payload只拼thinking的永不长出enable_thinking。

### 5、_infer_dialect和_dialect_payload函数

_infer_dialect从when_thinking_enabled模板推断思考payload方言。openai_extra_body。anthropic。vllm_chat_template。ollama。none。

_dialect_payload构造一个方言的开关payload。

### 6、_apply_legacy_thinking_settings函数

遗留思考payload路径。没有reasoning:契约的profile。

保留原样让已有配置保持行为。包括OpenAI兼容禁用路径上的合成reasoning_effort=minimal。

一个故意的变化是操作员模板怎么应用。两个模板以前用dict.update。模板的extra_body替换配置的整个extra_body。静默丢掉兄弟键。现在都走_merge_thinking_payload。键不移除。模板值在冲突时赢。

### 7、_apply_contract_thinking_settings函数

声明reasoning:契约的profile的思考payload路径。

启用。方言的启用payload深合并到操作员的when_thinking_enabled或thinking模板下面。契约声明历史需求且方言嵌套在extra_body时加clear_thinking。

禁用。when_thinking_disabled存在时用它。否则方言的禁用payload。

effort。最后在effort.path写。验证的请求赢模板值。没有effort契约的模型从不转发reasoning_effort。

### 8、_normalize_openai_base_url函数

把常见的api_base别名映射到base_url。OpenAI兼容客户端。

配置示例yaml里几个provider对其他模型类用api_base。用户经常错误地把api_base复制到这样的模型上。ModelConfig是extra="allow"。坏键在配置加载时不被抓。转发到构造函数。构造函数不拒绝它。转移进model_kwargs。然后展开进每次Completions.create()调用。OpenAI SDK在请求时拒绝。报不透明的unexpected keyword argument 'api_base'错误。端点覆盖静默丢失。

在这里重命名让模型按用户意图工作。

限定在issubclass(model_class, BaseChatOpenAI)。不是类路径允许列表。OpenAI兼容子类自动覆盖。自己声明api_base的类跳过。那里键是canonical的。不是typo。

### 9、_warn_unknown_model_settings函数

警告配置键会被OpenAI客户端静默转移到model_kwargs。

ModelConfig是extra="allow"。typo键（比如maxx_tokens）在配置加载时不被抓。LangChain的OpenAI客户端不拒绝未知构造参数。发UserWarning。转移键进model_kwargs。展开进每次调用。OpenAI SDK在请求时拒绝。不透明的unexpected keyword argument错误。很难追溯到配置typo。

这把潜在失败变成显式的、可操作的日志行。限定在OpenAI兼容族。其他provider路由extra kwargs的方式不同。会误报。

尽力而为。非致命。只打日志。

### 10、create_chat_model函数

这是主函数。

参数有name、thinking_enabled、app_config、attach_tracing、model_overrides、kwargs。

name为None时用配置的第一个模型。

流程分几步。

第一。从配置拿model_config。反射解析模型类。剥离元数据字段。

第二。遗留的reasoning布尔或字符串转发。ChatOllama用布尔形式。gpt-oss风格模型用low|medium|high字符串。

第三。model_overrides层叠。None值忽略。未设置的覆盖不清掉配置值。

第四。reasoning_effort从kwargs弹出。和model_overrides同样层叠。构造函数不能通过kwargs和配置设置同时收到同名键。Python会抛got multiple values for keyword argument。

第五。计算有效的when_thinking_enabled。合并thinking快捷字段。

第六。解析reasoning契约。create_chat_model是每个调用者的单一执行点。required thinking。不支持的thinking。受限的effort词汇。都在一个地方执行。

第七。按契约源应用思考设置。legacy或contract路径。

第八。规范化api_base到base_url。注入流块超时默认。

第九。Codex模型处理。去掉max_tokens。设置reasoning_effort。

第十。MindIE模型处理。max_retries默认1。

第十一。stream_usage默认开启。LangChain的BaseChatOpenAI只在没有自定义base_url时默认True。第三方端点（doubao、deepseek）静默丢失用量数据。

第十二。上下文窗口翻译。翻译声明的窗口到langchain profile。第三方OpenAI兼容模型的SDK不带自己的profile。SummarizationMiddleware fraction触发从profile["max_input_tokens"]解析阈值。

第十三。request_admission处理。获取请求准入限流器。和自定义rate_limiter冲突时抛错。SDK内部重试不重新进入BaseChatModel的准入钩子。max_retries设0。重试在中间件层。

第十四。警告未知的模型设置。

第十五。合并kwargs和设置。构造实例。

第十六。翻译上下文窗口到实例profile。

第十七。attach_tracing时附加追踪回调。主代理、图内标题中间件必须传False。否则同一LLM调用发重复span。session_id和user_id元数据不达trace。

## 三、它和谁协作

所有模型创建路径经过它。lead_agent。subagents。摘要。标题。一次性工具。

它反射解析模型类。resolve_class。

reasoning模块提供契约解析。resolve_reasoning_contract和resolve_reasoning_request。

request_admission提供限流器。

openai_codex_provider的CodexChatModel用于Codex检测。

它依赖tracing的build_tracing_callbacks。

## 四、重要性评级

评级是9分（满分10分）。

理由：

create_chat_model是所有模型创建的单一入口。主代理、子代理、摘要、标题、一次性工具全部经过这里。

它处理了大量provider特定细节。api_base到base_url的规范化。stream_chunk_timeout的默认。stream_usage默认。Codex的max_tokens处理。MindIE的max_retries。上下文窗口翻译。

它执行推理契约。required thinking。不支持的thinking。受限的effort词汇。在一个地方。

模板深合并防止兄弟键被静默丢掉。vLLM开关的双拼写镜像处理。

typo键的警告把潜在失败变成显式日志。

它是模型系统的核心。给9分。不给满分是因为它有很多provider特定的分支。理解成本高。
