# deerflow.models.patched_openai-档案

## 一、这个模块是干什么的

这个模块实现PatchedChatOpenAI。保留Gemini思考模型的thought_signature。

通过OpenAI兼容网关（Vertex AI、Google AI Studio、或任何代理）用Gemini思考模式时。API要求工具调用对象上的thought_signature字段在每次后续请求中原样回显。

OpenAI兼容网关把原始tool_call字典（包括thought_signature）存在additional_kwargs的tool_calls里。但标准的langchain_openai.ChatOpenAI只把标准字段（id、type、function）序列化到传出载荷。静默丢弃签名。导致HTTP 400 INVALID_ARGUMENT错误。说function call缺thought_signature。

这个模块覆盖_get_request_payload。把tool_call签名重新注入到传出载荷。对原始带签名的助手消息。

## 二、模块里的主要成员

### 1、PatchedChatOpenAI类

ChatOpenAI的变体。带thought_signature保留。Gemini思考通过OpenAI网关。

配置示例。name、display_name、use指向这个类、model、api_key、base_url、max_tokens、supports_thinking、supports_vision、when_thinking_enabled。

_get_request_payload方法。带thought_signature保留。先转换输入拿到原始LangChain消息。调super拿基础载荷。用restore_assistant_payloads恢复签名。

### 2、_restore_tool_call_signatures函数

把thought_signature重新注入到载荷消息的tool_call对象上。

原始tool_call字典从additional_kwargs的tool_calls取。载荷的tool_call对象。

构建id到原始tc的查找表。效率匹配。逐个载荷tc匹配。先按id。id没有时按位置回退。

网关可能用snake_case或camelCase。thought_signature或thoughtSignature。有签名时放载荷tc的thought_signature。

## 三、它和谁协作

factory通过反射用PatchedChatOpenAI。配置里use指向它。

assistant_payload_replay提供restore_assistant_payloads。

它依赖langchain_openai的ChatOpenAI。

## 四、重要性评级

评级是5分（满分10分）。

理由：

PatchedChatOpenAI解决Gemini思考模型的thought_signature问题。API要求签名在每次后续请求中原样回显。不解决的话HTTP 400 INVALID_ARGUMENT。

签名匹配先按id再按位置回退。网关可能用snake_case或camelCase。

它影响每个Gemini思考模型的每次调用。但它是特定provider的补丁。使用范围窄。给5分。
