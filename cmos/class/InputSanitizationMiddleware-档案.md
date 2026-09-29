# InputSanitizationMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/input_sanitization_middleware.py`

## 一、这个类是干什么的

InputSanitizationMiddleware是针对提示注入的输入护栏。

它把用户消息里被封锁的XML式标签做HTML转义。
比如`<system>`变成`&lt;system&gt;`。
转义后的标签渲染成字面文本。不再是结构化上下文标记。

用户的意图被保留。
比如用户问"怎么用DeerFlow的<system>标签"。
问题照样被理解。
注入攻击被中和。
这和AWS Bedrock的PII ANONYMIZE是同一个去标识不拒绝策略。

覆盖范围是整个对话。不只是最新一轮。
转义是请求范围的。线程状态里保留原文。
只扫最后一轮的护栏只能挡住一次模型调用。
下一轮原始载荷会原样重放。

被封锁的标签有两类。
一类是系统保留标签。比如memory、analysis。
一类是常见注入标签。比如system、instruction、role。
普通HTML和XML标签比如div、span不转义。

干净输入会被包进纯文本边界标记。
这是第二层语义防御。

意外错误时失败放行。原始请求照常交给内层。

## 二、类的成员

### （一）字段

没有声明公开字段。

### （二）方法

钩子方法是重点。

- `wrap_model_call`：同步钩子。对请求里的每条真实用户消息做转义。再交给内层。
- `awrap_model_call`：异步版本的同一个钩子。

核心方法：

- `_process_request`：对每条真实用户消息执行转义。框架注入的消息不转义。调用方提供的消息即使带框架标记也转义。
- `_try_process`：容错包装。意外错误时返回原请求。GraphBubbleUp照常传播。
- `_sanitize_message`：返回转义后的消息副本。什么都不需要改时返回None。
- `_extract_text_from_content`：从字符串或内容块列表里提取文本。列表里的裸字符串也要收集。
- `_rebuild_content`：把文本块合并成一个。保留交错的非文本块。比如图片块。

## 三、它和谁协作

- 它是中间件链里最外面的wrap_model_call包装。所以包括LLM重试在内的所有内层中间件看到的都是已转义的消息。
- 它和ToolResultSanitizationMiddleware对称。一个管用户输入。一个管远程工具结果。
- 它和PiiRedactionMiddleware互补。那个管内容层面的PII。
- Gateway在入口标记调用方提供的消息。

## 四、重要性评级

评级：9/10。

理由：提示注入是最现实的攻击面。用户消息直接来自不可信输入。伪造的system标记能让攻击者劫持框架上下文。这个中间件是所有内层中间件的安全前提。转义而非拒绝的策略也保住了正常使用。所以给9分。