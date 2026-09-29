# TerminalResponseMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/terminal_response_middleware.py`

## 一、这个类是干什么的

TerminalResponseMiddleware防止空的终态响应变成无声的成功。

场景是这样的。

模型执行完工具之后。
最后一条AI消息应该是给用户的最终回答。
但模型可能返回一条空消息。
没有可见内容。也没有工具调用意图。
用户什么也看不到。
运行看起来成功了。实际上什么都没交付。

这个中间件在`after_model`位置做最后一道兜底。

它检查三个条件。

第一是最后一条消息是AIMessage。

第二是这条消息没有可见内容。也没有工具调用意图。

第三是本轮真的有工具结果。也就是最新的真实用户消息之后跟着ToolMessage。

三个条件都满足才动手。
把空消息替换成带兜底文案的副本。
文案是"模型完成了工具运行但没有返回最终响应。请重试或换个模型"。
副本盖上`deerflow_error_fallback`标记和错误原因。
运行工作器凭标记把运行记成错误而不是无声成功。

## 二、类的成员

### （一）字段

没有声明公开字段。

### （二）方法

钩子方法是重点。

- `after_model`和`aafter_model`：模型响应之后检查空终态。满足条件就替换成兜底副本。

辅助方法：

- `release_policy_parameters`：声明空响应重试上限和兜底文案的哈希。
- `_apply`：执行检查和替换的主逻辑。

模块级函数：

- `_tool_result_in_current_turn`：判断最新真实用户消息之后是否跟着工具结果。

## 三、它和谁协作

- 它挂在中间件链的尾部。在terminal-response、safety、clarification这一段。
- 它消费model_response模块的判定函数。has_visible_content和has_tool_call_intent。
- 它盖的`deerflow_error_fallback`标记被运行工作器消费。
- 它和SafetyFinishReasonMiddleware、ModelLengthFinishReasonMiddleware同属响应修复尾部。

## 四、重要性评级

评级：7/10。

理由：空终态响应是真实的失败模式。没有这个兜底运行会以成功收场。用户看到空白。它保证失败至少被如实呈现。但它是兜底。触发面窄。所以给7分。