# deerflow.models.openai_codex_provider-档案

## 一、这个模块是干什么的

这个模块实现自定义OpenAI Codex provider。用ChatGPT Codex Responses API。

用Codex CLI的OAuth token。连chatgpt.com/backend-api/codex/responses端点。这是Codex CLI内部用的同一个端点。

支持自动加载凭据从~/.codex/auth.json。Responses API格式（不是Chat Completions）。工具调用。流式（端点要求）。指数退避重试。

## 二、模块里的主要成员

### 1、CODEX_BASE_URL

Codex API的基础URL。https://chatgpt.com/backend-api/codex。

### 2、_build_usage_metadata函数

把Codex/Responses API的usage字典转换成LangChain usage_metadata格式。映射OpenAI Responses API的token字段到LangChain AIMessage.usage_metadata期望的结构。避免依赖langchain_openai的私有helper。

缓存命中放input_token_details。推理token放output_token_details。

### 3、CodexChatModel类

这是核心类。BaseChatModel的变体。用ChatGPT Codex Responses API。

字段有model、reasoning_effort、retry_max_attempts。私有字段有_access_token、_account_id。

is_lc_serializable返回True。

model_post_init自动加载Codex CLI凭据。没有凭据时抛ValueError。提示期望~/.codex/auth.json或CODEX_AUTH_PATH。

### 4、_normalize_content方法

把LangChain内容块扁平化成纯文本给Codex。字符串直接。列表逐个连接。字典尝试text、output键。嵌套content递归。JSON序列化。

### 5、_convert_messages方法

把LangChain消息转换成Responses API格式。返回（instructions、input_items）。

SystemMessage进instructions。HumanMessage进user角色。AIMessage的content进assistant角色。工具调用进function_call条目。

一个细节。畸形调用停在invalid_tool_calls。但DanglingToolCallMiddleware用占位ToolMessage回答它们。Responses拒绝那个function_call_output除非它的function_call条目也在请求里。

function_call条目需要name和call_id。每个InvalidToolCall字段可空。缺任一个的调用被丢弃。而不是序列化成schema无效的条目。丢弃一个不会孤立占位ToolMessage。中间件在这些调用序列化前mint合成id和回退名。一个仍然缺它们的调用没有占位符配对。

ToolMessage进function_call_output条目。

### 6、_convert_tools方法

把LangChain工具格式转换成Responses API格式。

### 7、_call_codex_api方法

调用Codex Responses API。返回完成的响应。

payload带model、instructions、input、store=False、stream=True、reasoning。

headers带Authorization Bearer、ChatGPT-Account-ID、Content-Type、Accept、originator。

重试429、500、529。指数退避。2000ms乘以2的attempt次方。其他HTTP状态错误直接抛。其他异常直接抛。

### 8、_stream_response方法

从Codex API流式SSE。收集最终响应。

response.output_item.done事件的item按output_index记录。response.completed事件的response记录。

ChatGPT Codex可能只在流事件里发最终助手内容。response.completed到达时response.output可能还是空的。所以流事件的输出条目和response.output合并。

### 9、_parse_sse_data_line方法

从SSE流解析data行。跳过终态标记[DONE]。非JSON帧跳过。

### 10、_parse_tool_call_arguments方法

解析function-call参数。安全呈现畸形载荷。参数解析失败或不是JSON对象时返回invalid_tool_call。

### 11、_parse_response方法

把Codex Responses API响应解析成LangChain ChatResult。

reasoning类型的输出项提取推理摘要。message类型提取output_text。function_call类型解析成tool_calls或invalid_tool_calls。

usage转usage_metadata。reasoning_content放additional_kwargs。

### 12、_generate方法

生成响应。用Codex Responses API。

### 13、bind_tools方法

绑定工具给函数调用。BaseTool用convert_to_openai_function转换。字典处理function嵌套或直接。转换失败的用空schema。RunnableBinding包装。

## 三、它和谁协作

factory通过反射用CodexChatModel。配置里use指向它。

credential_loader提供load_codex_cli_credential和CodexCliCredential。

它依赖httpx发HTTP请求。依赖langchain_core的消息类型。

## 四、重要性评级

评级是6分（满分10分）。

理由：

CodexChatModel是Codex Responses API的主要provider。Responses API格式和Chat Completions不同。消息转换、工具调用、流式、重试都在这里。

SSE流的处理细。流事件和response.completed合并。ChatGPT Codex可能只在流事件里发最终内容。

invalid_tool_call的解析安全呈现畸形载荷。

工具调用配对的处理。缺name和call_id的调用被丢弃。不孤立占位ToolMessage。

它影响每个Codex模型的每次调用。给6分。
