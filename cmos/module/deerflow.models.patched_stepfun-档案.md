# deerflow.models.patched_stepfun-档案

## 一、这个模块是干什么的

这个模块实现PatchedChatStepFun。StepFun推理模型的适配器。

StepFun在流式delta和非流式响应里都返回reasoning（或deepseek风格的reasoning_content）。标准的ChatOpenAI忽略这些非标准字段。推理内容被静默丢弃。这个适配器从所有响应路径捕获reasoning。在历史助手消息上重放。多轮工具调用对话。

## 二、模块里的主要成员

### 1、_extract_reasoning函数

从字典或Pydantic对象提取reasoning内容。

StepFun可能通过reasoning（默认）或reasoning_content（deepseek风格）返回。检查两个字段。

字典按reasoning_content、reasoning顺序检查。键存在且不是None时返回。对象用getattr按同样顺序。model_extra也检查。

找不到返回_MISSING哨兵。

### 2、_with_reasoning_content函数

返回message的副本。reasoning_content存进additional_kwargs。已有值不同时更新。

### 3、_get_typed_choice_message函数

提取SDK类型的choice message。choices有值时返回index位置的message。

### 4、PatchedChatStepFun类

ChatOpenAI的变体。带完整reasoning支持。StepFun模型。

is_lc_serializable返回True。

lc_secrets映射api_key和openai_api_key到STEPFUN_API_KEY。

_get_request_payload方法。历史助手消息上恢复reasoning_content。用restore_assistant_payloads。

_convert_chunk_to_generation_chunk方法。流式delta捕获reasoning和reasoning_content。调super。choices有值时从delta提取。AIMessageChunk时用_with_reasoning_content更新。

_create_chat_result方法。非流式响应提取reasoning和reasoning_content。从choice_message提取。Pydantic对象时用_get_typed_choice_message。AIMessage时更新generations。

## 三、它和谁协作

factory通过反射用PatchedChatStepFun。配置里use指向它。

assistant_payload_replay提供restore_assistant_payloads和restore_reasoning_content。

它依赖langchain_openai的ChatOpenAI。

## 四、重要性评级

评级是5分（满分10分）。

理由：

PatchedChatStepFun解决StepFun推理模型的reasoning捕获和重放。两个字段reasoning和reasoning_content都检查。deepseek风格和默认风格都支持。

reasoning提取检查三个来源。字典。对象属性。model_extra。_MISSING哨兵区分"没有"和"空"。

它影响每个StepFun模型的每次调用。给5分。
