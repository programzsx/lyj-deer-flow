# deerflow_extension_api.model_invocation 档案

## 一、这个模块是干什么的

这个模块定义"宿主授予扩展的模型调用能力"的契约。

扩展有时需要调一次LLM。扩展不能自己拿模型凭据。也不能自己选模型。

宿主提供一个受控的模型调用器。扩展通过契约使用它。

调用是提供方中立的。不是流式的。纯文本。

宿主的错误也被规范化了。扩展拿到的错误不含提供方异常。不含凭据。

## 二、模块里的主要成员

- `ModelInvocationError`。规范化的宿主错误基类。不含提供方异常或凭据。

- `ModelInvocationUnavailable`。能力已停止。或配置的模型不可用。

- `ModelInvocationUnauthorized`。请求的逻辑角色没有授予这个安装。

- `ModelInvocationFailed`。调用失败。超过宿主限额。或超时。

- `ModelOutputValidationError`。提供方输出无法解析。或不符合schema。是Failed的子类。

- `ModelMessage`。一条消息。role限定system、user、assistant。content是字符串。

- `ModelInvocationRequest`。调用请求。包含消息、逻辑模型角色、用途、响应schema、超时。`__post_init__`把messages转成tuple。

- `ModelUsage`。token用量。输入、输出、总数。

- `ModelInvocationResult`。调用结果。包含文本内容、结构化输出、解析到的模型、用量。

- `ModelInvoker`。Protocol。`invoke(request)`。调用一次。schema请求只有在校验过的对象数据下才成功。调用者的取消以asyncio.CancelledError传播。超时抛Failed。

## 三、它和谁协作

它只依赖标准库。是纯契约模块。

宿主实现ModelInvoker。通过ExtensionRuntimeDeps注入给扩展服务。

扩展服务是消费方。

## 四、重要性评级

评级是3分。

理由如下。

它是扩展调用模型的安全通道。错误规范化保证凭据不泄漏给扩展。

契约设计干净。错误分级清晰。取消和超时的语义明确。

扣分原因。它是可选能力。不用模型调用的扩展完全不经过它。它是纯类型契约。没有实现逻辑。使用频率取决于扩展生态。
