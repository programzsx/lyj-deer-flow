# deerflow.models.patched_deepseek-档案

## 一、这个模块是干什么的

这个模块实现PatchedChatDeepSeek。在多轮对话中保留reasoning_content。

这是ChatDeepSeek的补丁版。正确处理reasoning_content在发消息回API时。原始实现在additional_kwargs里存reasoning_content。但发后续API调用时不包含它。导致思考模式启用时API在所有助手消息上要求reasoning_content报错。

## 二、模块里的主要成员

### 1、_thinking_enabled函数

返回请求是否显式启用DeepSeek思考模式。检查多个来源。每个来源是字典时检查thinking键的type是否enabled。或extra_body嵌套的thinking键。

### 2、_restore_deepseek_assistant_payload函数

恢复助手历史和需要的思考模式占位符。

恢复reasoning_content。有tool_calls且content是None时content设为空字符串。注释解释原因。DeepSeek要求工具调用历史用空字符串。而不是null。

思考模式启用且有tool_calls且没有reasoning_content时设空字符串。思考模式的工具轮次需要这个字段。即使没有推理输出。

### 3、PatchedChatDeepSeek类

ChatDeepSeek的变体。带reasoning_content保留。

is_lc_serializable返回True。

lc_secrets映射api_key和openai_api_key到DEEPSEEK_API_KEY。

_get_request_payload方法。带reasoning_content保留。先转换输入。过滤掉deerflow_error_fallback标记的AIMessage。调super。判断请求思考模式。用restore_assistant_payloads恢复。

## 三、它和谁协作

factory通过反射用PatchedChatDeepSeek。配置里use指向它。

assistant_payload_replay提供restore_assistant_payloads和restore_reasoning_content。

它依赖langchain_deepseek的ChatDeepSeek。

## 四、重要性评级

评级是5分（满分10分）。

理由：

PatchedChatDeepSeek解决DeepSeek思考模型的reasoning_content保留问题。思考模式下API要求所有助手消息带这个字段。原始实现不包含它。

工具调用历史的content必须是空字符串而不是null。思考模式的工具轮次需要reasoning_content占位符即使没有推理输出。

deerflow_error_fallback标记的AIMessage被过滤。不发给API。

它影响每个DeepSeek模型的每次调用。给5分。
