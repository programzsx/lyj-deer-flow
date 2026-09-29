# TodoMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/todo_middleware.py`

## 一、这个类是干什么的

TodoMiddleware在TodoListMiddleware的基础上扩展了两个能力。

第一个能力是上下文丢失检测。

消息历史被截断的时候。比如SummarizationMiddleware压缩了历史。
原来的write_todos工具调用和它的ToolMessage会被滚出活动上下文窗口。
模型就忘了当前的任务清单。
这个中间件在`before_model`检测到这种情况。
注入一条提醒消息。
让模型继续跟踪进度。

第二个能力是防止提前退出。

模型产出最终响应（没有工具调用）的时候。
如果任务清单里还有未完成项。
中间件排队一条提醒。
跳回模型节点。强制继续推进。

提醒注入用`wrap_model_call`。不持久化成普通用户可见消息。

有一个重试上限。默认2次。防止代理无法继续推进时无限循环。

有一个让位规则。
长度截断已经把这一轮终态化的时候。
重新激活只会把同样超大的工具调用再打进同一个上限。
所以让位给`model_length_termination`标记。

## 二、类的成员

### （一）字段

- `state_schema`：固定为ThreadState。
- `_MAX_COMPLETION_REMINDERS`：完成提醒的重试上限。默认2。
- `_MAX_COMPLETION_REMINDER_KEYS`：提醒键的最大数量。4096。

### （二）方法

钩子方法是重点。

- `before_model`和`abefore_agent`：write_todos离开上下文窗口时注入任务清单提醒。
- `after_model`和`aafter_model`：未完成项存在时防止提前退出。注入提醒并跳回模型节点。带can_jump_to配置。
- `before_agent`和`abefore_agent`：清理其它运行的完成提醒。
- `after_agent`和`aafter_agent`：清理当前运行的完成提醒。
- `wrap_model_call`和`awrap_model_call`：把排队的完成提醒注入请求。

核心方法：

- `_truncate_task_calls`之外，基类的并行write_todos检查被保留。
- `_queue_completion_reminder`：排队一条完成提醒。带容量上限。
- `_drain_completion_reminders`：取走当前运行的提醒。
- `_restore_pending`类逻辑：模型调用抛异常时把提醒塞回去。
- `_augment_request`：把提醒加进请求。
- `_format_pending_completion_reminders`：把多条提醒合并成一条提示。
- `_prune_completion_reminder_state_locked`：修剪提醒状态。防累积。

## 三、它和谁协作

- 它继承TodoListMiddleware。基类提供write_todos工具和并行调用检查。
- 它和SummarizationMiddleware协作。压缩造成上下文丢失。它负责检测和提醒。
- 它消费ModelLengthFinishReasonMiddleware盖的`model_length_termination`标记。让位。
- 它的跳回逻辑和LangGraph的图路由协作。

## 四、重要性评级

评级：7/10。

理由：提前退出和上下文丢失是计划模式的真实失败模式。任务做到一半模型就收工了。这个中间件强制把清单推完。重试上限防死循环。让位规则避免和长度上限打架。它只在计划模式生效。所以给7分。