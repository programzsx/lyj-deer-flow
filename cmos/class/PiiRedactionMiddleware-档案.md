# PiiRedactionMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/pii_redaction_middleware.py`

## 一、这个类是干什么的

PiiRedactionMiddleware在PII到达模型之前把它改写成占位符。

PII有两个不受信任的入口。

第一个入口是真实的用户消息。用户可能在消息里贴身份证号、信用卡号。线程状态里保留原文。界面仍然显示原始消息。但每次模型调用都会重新脱敏。

第二个入口是远程内容的工具结果。网页正文和搜索片段可能包含别人的PII。这部分在工具边界上脱敏。脱敏后的文本才是进入模型上下文的内容。

占位符由部署级`token_secret`加HMAC派生。同一个原始值永远得到同一个占位符。身份在轮次之间保持稳定。不需要存映射表。

子代理也被覆盖。因为构建子代理运行时中间件时复用了这个基类。

内存入队路径也被覆盖。入队的载荷同样脱敏。

意外错误时选择失败放行。原始内容照常到达模型。这与其它护栏一致。一行处理不了的数据不应该弄垮整个运行。取舍会记进日志。

## 二、类的成员

### （一）字段

配置在`__init__`里传入。只有`pii_redaction.enabled`为true时才会装配这个中间件。所以每个实例至少有一个激活的检测器。

### （二）方法

钩子方法是重点。

- `wrap_model_call`：同步钩子。对请求里的真实用户消息做PII脱敏。再交给内层。
- `awrap_model_call`：异步版本的同一个钩子。
- `wrap_tool_call`：同步工具钩子。按白名单判断是否需要脱敏。对工具结果执行脱敏。
- `awrap_tool_call`：异步版本的同一个钩子。

辅助方法：

- `release_policy_parameters`：声明影响行为的配置。
- `_process_request`：对请求里的用户消息执行脱敏。
- `_try_process`：脱敏的容错包装。意外错误时失败放行。
- `_should_redact`：判断一个工具调用是否属于脱敏范围。范围和ToolResultSanitizationMiddleware一致。
- `_redact_result`：脱敏一个工具调用结果。直接ToolMessage直接改。Command结果重建其中的ToolMessage。
- `_redact_tool_message`：用同一个_Redactor脱敏单条ToolMessage。

## 三、它和谁协作

- 它挂在中间件链上，同时有模型调用钩子和工具调用钩子。
- 它和InputSanitizationMiddleware、ToolResultSanitizationMiddleware互补。那两个处理注入标签这类结构性威胁。这个处理内容层面的PII。
- 它依赖`token_secret`派生占位符。
- 它消费_Detector和_Redactor。
- 子代理运行时中间件构建复用它的配置。

## 四、重要性评级

评级：8/10。

理由：PII泄漏是合规和安全上的硬风险。这个中间件把两个不受信任入口都覆盖了。占位符的确定性设计让脱敏不会破坏对话连贯性。失败放行的取舍也讲清楚了。它是数据安全护栏的核心一环。所以给8分。