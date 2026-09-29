# DanglingToolCallMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/dangling_tool_call_middleware.py`

## 一、这个类是干什么的

DanglingToolCallMiddleware修复消息历史里的悬挂工具调用和孤儿工具结果。

有两种坏数据。

第一种是悬挂工具调用。AI消息带着tool_calls。但历史里没有对应的ToolMessage。用户打断或请求取消会造成这种。

第二种是孤儿工具结果。ToolMessage存在。但匹配的AI消息tool_call没了。摘要压缩或分支裁剪会丢掉上游AI消息造成这种。

两种都会让严格的提供方拒绝请求。

这个中间件拦截模型调用做三件事。

第一件是在提供方序列化之前清理格式坏掉的工具调用名和参数。

第二件是给每个悬挂的tool_call插入带错误标记的合成ToolMessage。插在正确的位置。

第三件是丢弃源tool_call已经不存在的孤儿ToolMessage。防止严格的OpenAI兼容后端返回400。

用`wrap_model_call`而不用`before_model`。因为补丁必须插在每个悬挂AI消息的紧后面。before_model加add_messages归约器只会追加到末尾。位置不对。

## 二、类的成员

### （一）字段

没有声明公开字段。

### （二）方法

钩子方法是重点。

- `wrap_model_call`：同步钩子。在模型调用前扫描历史。补合成ToolMessage。丢孤儿ToolMessage。清理格式。再把修补后的消息交给内层。
- `awrap_model_call`：异步版本的同一个钩子。

辅助方法：

- `_message_tool_calls`：从结构化字段或原始provider载荷取规范化的工具调用。格式坏的provider调用也会被当成悬挂调用处理。
- `_normalize_tool_call_ids`：把格式坏的工具调用id替换成合成id。没有id的调用永远进不了配对集合。它的结果会被当孤儿丢掉。
- `_sanitize_ai_message_tool_calls`：返回工具调用可以安全序列化的AI消息。
- `_synthetic_tool_message_content`：生成合成错误响应的内容。
- `_build_patched_messages`：把工具结果分组到各自的tool_call AI消息后面。规范模型可见的因果顺序。

## 三、它和谁协作

- 它挂在中间件链的模型调用边界上。在LLMErrorHandlingMiddleware附近。
- 它消费线程状态里的messages。
- 它保护的目标是严格的OpenAI兼容提供方。比如vLLM、Moonshot、DeepSeek。
- 它和SummarizationMiddleware间接协作。摘要压缩会造成孤儿ToolMessage。这个中间件负责清理。

## 四、重要性评级

评级：8/10。

理由：悬挂工具调用会让后续所有请求被提供方400拒绝。整个线程被卡死。用户打断是高频操作。所以这种坏数据一定会出现。这个中间件是线程健康的关键防线。所以给8分。