# CodexChatModel-档案.md

源文件位置。

这个类定义在`backend/packages/harness/deerflow/models/openai_codex_provider.py`。

## 一、这个类是干什么的

CodexChatModel是DeerFlow自定义的OpenAI Codex模型适配器。

这个类继承自`langchain_core.language_models.chat_models.BaseChatModel`。

注意这个类不是继承`ChatOpenAI`。

这个类是从`BaseChatModel`从头实现的。

模块docstring说明了这个类的定位。

模块docstring的原话是"Custom OpenAI Codex provider using ChatGPT Codex Responses API"。

意思是"自定义OpenAI Codex提供商，使用ChatGPT Codex Responses API"。

先讲这个类解决什么问题。

Codex CLI用的端点是`chatgpt.com/backend-api/codex/responses`。

这个端点不走标准的Chat Completions协议。

这个端点用Responses API格式。

这个端点强制要求流式传输。

这个端点用Codex CLI的OAuth令牌认证。

标准的`ChatOpenAI`完全覆盖不了这些差异。

所以DeerFlow从`BaseChatModel`自己实现了一个适配器。

模块docstring列出了支持的能力。

能力一。从`~/.codex/auth.json`自动加载凭证。

能力二。Responses API格式（不是Chat Completions）。

能力三。工具调用。

能力四。流式传输（端点强制要求）。

能力五。指数退避重试。

### 使用场景

这个类通过config.yaml的`use:`字段配置。

配置示例在类docstring里。

```yaml
- name: gpt-5.4
  use: deerflow.models.openai_codex_provider:CodexChatModel
  model: gpt-5.4
  reasoning_effort: medium
```

## 二、类的成员

### 字段

字段`model`。

类型是字符串。默认是`"gpt-5.4"`。

指定调用的Codex模型名。

字段`reasoning_effort`。

类型是字符串。默认是`"medium"`。

指定推理强度。

字段`retry_max_attempts`。

类型是整数。默认是3。

重试次数上限。

私有字段`_access_token`。

保存OAuth令牌。

私有字段`_account_id`。

保存ChatGPT账号ID。

### 类方法`is_lc_serializable`

输出布尔值。返回True。

声明这个类可以被LangChain序列化。

### 属性`_llm_type`

输出字符串。返回`"codex-responses"`。

标识这个模型的类型名。

### 方法`_validate_retry_config`

校验`retry_max_attempts`必须大于等于1。

### 方法`model_post_init`

实例化时自动调用。

流程如下。

第一步。校验重试配置。

第二步。调用`_load_codex_auth`加载凭证。

凭证存在。

把令牌和账号ID存进私有字段。

凭证不存在。

直接抛ValueError。

模型构造失败。

第三步。调用父类的`model_post_init`。

### 方法`_load_codex_auth`

输出`CodexCliCredential`或None。

直接转发到`load_codex_cli_credential`。

凭证加载逻辑在`credential_loader.py`里。

### 类方法`_normalize_content`

输入是任意内容。输出纯文本字符串。

这个方法把LangChain的内容块压平成纯文本。

Codex端点不接受多模态块。

字符串原样返回。

列表递归处理再拼接。

字典尝试取`text`或`output`字段。

取不到就JSON序列化。

### 方法`_convert_messages`

输入是LangChain消息列表。

输出元组`(instructions, input_items)`。

这个方法把LangChain消息转成Responses API格式。

`SystemMessage`的内容汇总成`instructions`。

多条系统消息用双换行拼接。

没有系统消息时用默认值"You are a helpful assistant."。

`HumanMessage`转成`{"role": "user", "content": ...}`。

`AIMessage`的文本转成`{"role": "assistant", "content": ...}`。

`AIMessage`的工具调用转成`function_call`条目。

这里有一个重要细节。

代码注释讲了很长的处理逻辑。

畸形工具调用停在`invalid_tool_calls`上。

`DanglingToolCallMiddleware`会用占位`ToolMessage`应答这些调用。

但Responses API拒绝`function_call_output`。

除非请求里也有对应的`function_call`条目。

所以畸形调用也要序列化成`function_call`条目。

`function_call`条目需要`name`和`call_id`。

`InvalidToolCall`的字段都是可空的。

缺名字或缺ID的调用直接丢弃。

不会造成孤立的占位应答。

`ToolMessage`转成`function_call_output`条目。

### 方法`_convert_tools`

输入是LangChain工具格式列表。输出Responses API工具格式列表。

把嵌套的`{"type": "function", "function": {...}}`拍平。

### 方法`_call_codex_api`

输入是消息和工具。输出完整的响应字典。

这个方法发起API调用。

流程如下。

第一步。转换消息。

第二步。组装负载。

负载里`store`是False。

`stream`是True。

流式是端点强制要求。

`reasoning`字段带强度和摘要设置。

第三步。组装请求头。

有`Authorization: Bearer`头。

有`ChatGPT-Account-ID`头。

有`originator: codex_cli_rs`头。

模仿Codex CLI。

第四步。带重试地调用`_stream_response`。

只重试429、500、529三种状态码。

其他错误直接抛。

重试按指数退避。

### 方法`_stream_response`

输入是请求头和负载。输出完整响应字典。

这个方法流式读取SSE并收集最终响应。

用`httpx.Client`发请求。

超时是300秒。

逐行解析SSE数据。

`response.output_item.done`事件。

把输出条目按`output_index`存起来。

`response.completed`事件。

取出完整响应。

这里有一个重要的兼容处理。

代码注释说明了原因。

ChatGPT Codex可能只在流事件里发最终的助手内容。

`response.completed`到达时。

`response.output`可能还是空的。

所以要把流里收集的输出条目合并进最终响应。

合并时按`output_index`对齐。

`response.output`里已有的条目不覆盖。

空位补上流里的条目。

没有`response.completed`事件。

抛RuntimeError。

### 静态方法`_parse_sse_data_line`

输入是一行文本。输出字典或None。

解析SSE数据行。

跳过非data行。

跳过`[DONE]`标记。

跳过非JSON数据。

### 方法`_parse_tool_call_arguments`

输入是输出条目。输出元组`(参数字典或None, invalid_tool_call或None)`。

安全地解析工具调用参数。

参数是字典。直接用。

参数是JSON字符串。解析成字典。

解析失败或不是字典。

返回`invalid_tool_call`。

带错误说明。

不抛异常。

### 方法`_parse_response`

输入是完整响应。输出LangChain的`ChatResult`。

这个方法把Responses API响应转回LangChain格式。

逐个处理输出条目。

`reasoning`类型的条目。

提取推理摘要文本。

`message`类型的条目。

提取`output_text`内容。

`function_call`类型的条目。

解析成`tool_calls`或`invalid_tool_calls`。

推理内容放进`additional_kwargs["reasoning_content"]`。

token用量转成`usage_metadata`。

### 方法`_generate`

输入是消息列表。输出`ChatResult`。

这是LangChain的同步生成入口。

先调API。再解析响应。

### 方法`bind_tools`

输入是工具列表。输出`RunnableBinding`。

绑定工具用于函数调用。

支持`BaseTool`对象和字典两种输入。

`BaseTool`用`convert_to_openai_function`转换。

转换失败就用基础信息兜底。

### 模块级辅助函数`_build_usage_metadata`

这个函数不是类成员。

但和这个类强相关。

函数把Codex的usage字典转成LangChain的`usage_metadata`格式。

代码注释说明了为什么不用langchain_openai的私有helper。

为了避免依赖`langchain_openai`的私有函数`_create_usage_metadata_responses`。

私有函数没有稳定性保证。

## 三、它和谁协作

### 继承关系

CodexChatModel继承自`langchain_core.language_models.chat_models.BaseChatModel`。

这是LangChain聊天模型的抽象基类。

### 调用了谁

第一。`deerflow.models.credential_loader`。

调用了`load_codex_cli_credential`和`CodexCliCredential`。

第二。`httpx`库。

发HTTP请求和读SSE流。

第三。`langchain_core`的消息、输出、工具工具类。

### 被谁调用

模型工厂`create_chat_model`按config.yaml的`use:`路径实例化这个类。

### 协作的中间件

`DanglingToolCallMiddleware`和这个类有配合关系。

中间件给畸形工具调用补占位应答。

这个类保证占位应答不会变成孤立条目。

## 四、重要性评级

评级是6分。

理由如下。

第一点。

这个类是Codex模型接入的唯一实现。

用ChatGPT订阅跑DeerFlow完全靠这个类。

第二点。

这个类解决的问题很特殊。

Responses API格式、强制流式、SSE解析、输出合并。

这些是标准`ChatOpenAI`覆盖不了的。

从`BaseChatModel`从头实现。

代码量不小。

第三点。

如果删掉这个类。

Codex这条路完全断掉。

`CodexCliCredential`失去主要消费方。

但其他模型路径不受影响。

第四点。

使用面相对窄。

Codex接入是小众入口。

config.example.yaml里没有这个类的示例。

主流场景还是标准API密钥的OpenAI兼容端点。

第五点。

这个类有完整的功能闭环。

凭证、消息转换、流式解析、工具调用、重试。

不依赖langchain_openai的私有实现。

独立性好。

综合以上。

这是一个独立完整但适用面较窄的适配器。

评级6分。
