# deerflow.models.patched_mimo-档案

## 一、这个模块是干什么的

这个模块实现PatchedChatMiMo。小米MiMo的reasoning_content重放适配器。

MiMo的OpenAI兼容API在思考模式返回reasoning_content。要求这个值在多轮代理对话中在历史助手消息上重放。标准的langchain_openai.ChatOpenAI丢弃这个provider特定字段。工具调用进入对话历史后导致HTTP 400错误。

## 二、模块里的主要成员

### 1、_extract_reasoning_content函数

从字典或Pydantic对象提取reasoning_content。保留空字符串。

字典直接取reasoning_content键。键存在且不是None时返回。对象用getattr。model_extra也检查。

找不到返回_MISSING哨兵。

### 2、_with_reasoning_content函数

返回message的副本。reasoning_content存进additional_kwargs。已有值不同时更新。

### 3、PatchedChatMiMo类

ChatOpenAI的变体。带reasoning_content保留。MiMo思考模式。

is_lc_serializable返回True。

lc_secrets映射api_key和openai_api_key到MIMO_API_KEY。

_get_request_payload方法。恢复reasoning_content到序列化载荷。用restore_assistant_payloads。

_convert_chunk_to_generation_chunk方法。流式delta捕获reasoning。调super。choices有值时从delta提取reasoning。AIMessageChunk时用_with_reasoning_content更新。

_create_chat_result方法。非流式响应捕获reasoning。从choice_message提取。Pydantic对象时用_get_typed_choice_message。AIMessage时更新generations。

## 三、它和谁协作

factory通过反射用PatchedChatMiMo。配置里use指向它。

assistant_payload_replay提供restore_assistant_payloads和restore_reasoning_content。

它依赖langchain_openai的ChatOpenAI。

## 四、重要性评级

评级是5分（满分10分）。

理由：

PatchedChatMiMo解决MiMo思考模型的reasoning_content重放问题。API要求历史助手消息带这个字段。工具调用进入历史后HTTP 400。

reasoning提取保留空字符串。_MISSING哨兵区分"没有"和"空"。Pydantic对象和model_extra都检查。

它影响每个MiMo模型的每次调用。给5分。
