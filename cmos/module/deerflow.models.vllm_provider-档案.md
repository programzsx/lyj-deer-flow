# deerflow.models.vllm_provider-档案

## 一、这个模块是干什么的

这个模块实现自定义vLLM provider。建立在LangChain的ChatOpenAI上。

vLLM 0.19.0通过OpenAI兼容API暴露推理模型。但LangChain的默认OpenAI适配器从助手消息和流式delta中丢弃非标准的reasoning字段。这破坏了交错思考加工具调用的流程。因为vLLM期望助手先前的推理在后续轮次被回显。

这个provider在三种路径上保留reasoning。非流式响应。流式delta。多轮请求载荷。

它还实现可选的cumulative_stream_usage。把供应商重复的累计token快照转换成每块delta。

## 二、模块里的主要成员

### 1、_normalize_vllm_chat_template_kwargs函数

把DeerFlow的遗留thinking开关映射到vLLM和Qwen的enable_thinking。

DeerFlow最初记录extra_body.chat_template_kwargs.thinking。但vLLM 0.19.0的Qwen推理解析器读chat_template_kwargs.enable_thinking。在发送前规范化payload。已有配置继续工作。flash模式真正禁用推理。

### 2、_reasoning_to_text函数

从vLLM载荷提取可读的推理文本。字符串直接返回。列表逐个递归连接。字典尝试text、content、reasoning键。都不行JSON序列化。

### 3、_convert_delta_to_message_chunk_with_reasoning函数

把流式delta转换成LangChain消息块。同时保留reasoning。

保留function_call。保留reasoning和reasoning_content。保留tool_call_chunks。按role分发到对应的消息chunk类。

### 4、_restore_reasoning_field函数

把vLLM reasoning重新注入到传出的助手消息。reasoning从additional_kwargs取。没有时取reasoning_content。

### 5、VllmChatModel类

这是核心类。ChatOpenAI的变体。

_llm_type是vllm-openai-compatible。

cumulative_stream_usage是可选的模型设置。默认False。供应商在每个流块上重复累计token总数时启用。

_usage_delta方法。把一个completion的累计快照转换成delta。subtract_usage从usage减去previous。终态时弹出。否则记录。LRU容量1024。软上限。只淘汰空闲至少一小时的条目。活跃流可以临时超过上限。淘汰不会破坏它们的delta。

_clear_usage_snapshot方法。忘记完成的流。即使终态帧没有usage。

_get_request_payload方法。恢复助手推理到请求载荷。交错思考。转换输入。调super。规范化chat_template_kwargs。恢复reasoning字段。

消息长度相等时逐对恢复。不等时按AIMessage和assistant载荷配对。

_create_chat_result方法。非流式响应保留vLLM reasoning。从choice的message取reasoning。放到additional_kwargs。

_convert_chunk_to_generation_chunk方法。流式delta保留vLLM reasoning。content.delta类型返回None。空choices处理终态usage。把usage_metadata转成delta。记录completion_id。没有completion_id时清空快照。

### 6、_get_completion_id函数

供应商提供稳定completion id时返回。chunk的id或嵌套chunk的id。

## 三、它和谁协作

factory通过反射用VllmChatModel。配置里use指向它。

它依赖langchain_openai的ChatOpenAI。依赖langchain_core的消息类型和usage_metadata助手。

测试是test_vllm_provider.py。

## 四、重要性评级

评级是6分（满分10分）。

理由：

VllmChatModel是vLLM模型的主要provider。vLLM 0.19.0的Qwen推理模型需要reasoning字段在三种路径上保留。

thinking到enable_thinking的规范化处理了DeerFlow遗留配置和vLLM实际读取键的差别。

cumulative_stream_usage的实现细。按completion id隔离交错流。没有稳定id时保持原始usage不动。软上限1024。只淘汰空闲至少一小时的。活跃流可以临时超过。终态时弹出。

它影响每个vLLM模型的每次调用。给6分。
