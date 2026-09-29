# deerflow.models.patched_minimax-档案

## 一、这个模块是干什么的

这个模块实现PatchedChatMiniMax。MiniMax的reasoning输出适配器。

MiniMax的OpenAI兼容chat completions API在extra_body.reasoning_split=true启用时可以返回结构化的reasoning_details。langchain_openai.ChatOpenAI目前忽略那个字段。DeerFlow的前端收不到预期形状的推理内容。

这个适配器在请求载荷里保留reasoning_split。把provider特定的推理字段映射到additional_kwargs.reasoning_content。DeerFlow已经理解这个字段。

## 二、模块里的主要成员

### 1、_THINK_TAG_RE正则

匹配think标签。提取推理内容。

### 2、_extract_reasoning_text函数

从reasoning_details列表提取推理文本。每个item是Mapping时取text键。strip后非空的加入。join。

### 3、_strip_inline_think_tags函数

剥离内容里的内联think标签。提取推理。返回清洗后的内容和推理。

### 4、_merge_reasoning函数

合并多个推理值。strip后非空且不重复的加入。join。

### 5、_with_reasoning_content函数

返回message的副本。reasoning_content存进additional_kwargs。

preserve_whitespace为True时直接追加。流式delta需要保留空白。为False时合并。

### 6、PatchedChatMiniMax类

ChatOpenAI的变体。保留MiniMax推理输出。

_get_request_payload方法。reasoning_split设True。_strip_user_message_names剥离user消息的name字段。

注释解释原因。DeerFlow中间件给user消息打内部来源名字（user-input、summary、loop_warning）。langchain_openai把那些序列化到OpenAI兼容请求。MiniMax要求每个user角色的name一致。否则拒绝请求。报invalid params, user name must be consistent (2013)。MiniMax不使用每消息作者名。所以剥离。

_convert_chunk_to_generation_chunk方法。流式delta捕获reasoning_details。保留空白。usage_metadata。

_create_chat_result方法。非流式响应。剥离内联think标签。从choice_message提取split reasoning。合并。AIMessage时更新content和reasoning。

## 三、它和谁协作

factory通过反射用PatchedChatMiniMax。配置里use指向它。

它依赖langchain_openai的ChatOpenAI。依赖langchain_openai的_convert_delta_to_message_chunk和_create_usage_metadata。

## 四、重要性评级

评级是5分（满分10分）。

理由：

PatchedChatMiniMax解决MiniMax的reasoning输出适配。reasoning_split返回结构化reasoning_details。标准适配器忽略。前端收不到预期形状。

user消息name字段的剥离处理了MiniMax的name一致性要求。否则请求被拒绝。

内联think标签的剥离和reasoning_details的合并。流式保留空白。

它影响每个MiniMax模型的每次调用。给5分。
