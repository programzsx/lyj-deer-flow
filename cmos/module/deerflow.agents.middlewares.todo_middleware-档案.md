# deerflow.agents.middlewares.todo_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/todo_middleware.py。

## 一、这个中间件是干什么的

这个中间件在LangChain自带TodoListMiddleware的基础上扩展了两个能力。

第一个能力是上下文丢失检测。

任务清单存在状态里。

但是原始的write_todos工具调用可能被摘要压缩挤出了上下文窗口。

模型看不到write_todos调用就忘了任务清单。

这个中间件检测到这种情况就注入提醒消息。

提醒消息让模型继续跟踪任务进度。

第二个能力是防止提前退出。

模型想给最终回答时如果还有未完成任务。

这个中间件拦截这次退出。

这个中间件注入提醒并跳回模型节点。

模型被迫继续完成任务。

这个中间件只在is_plan_mode开启时被装配。

## 二、模块里的主要成员

### 1、TodoMiddleware类

TodoMiddleware是这个中间件的核心类。

这个类继承LangChain的TodoListMiddleware。

继承保留了基类的全部能力。

基类提供write_todos工具。

基类提供并行write_todos检测。

基类提供write_todos系统提示注入。

state_schema设置为ThreadState。

### 2、上下文丢失检测

before_model钩子做上下文丢失检测。

before_model在每次模型调用前执行。

检测逻辑分四步。

第一步读状态里的todos。

todos为空就什么都不做。

第二步检查消息里是否还有write_todos调用。

_todos_in_messages辅助函数做这个检查。

write_todos还在上下文里就什么都不做。

第三步检查提醒是否已经注入过。

_reminder_in_messages辅助函数做这个检查。

提醒还没被挤掉就不重复注入。

第四步注入提醒。

提醒用HumanMessage承载。

提醒消息的name是todo_reminder。

提醒消息带hide_from_ui标记。

hide_from_ui让提醒不出现在用户界面。

提醒内容包在system_reminder标签里。

提醒内容列出当前任务清单。

### 3、防止提前退出

after_model钩子做提前退出拦截。

这个钩子声明了can_jump_to=["model"]。

声明允许返回jump_to指令。

after_model的逻辑分五步。

第一步先跑基类的after_model。

基类处理并行write_todos检测。

基类返回结果就直接返回。

第二步判断最后一条AI消息是否是干净的最终回答。

_has_tool_call_intent_or_error辅助函数做这个判断。

消息带工具调用就不算干净的最终回答。

消息带invalid_tool_calls不算干净。

消息的additional_kwargs里有tool_calls或function_call不算干净。

消息的finish_reason是tool_calls或function_call不算干净。

这个辅助函数把工具意图信号全部收拢。

LangChain版本升级时只需要改这一个函数。

deerflow_error_fallback标记的消息不拦截。

错误回退消息不该再被提醒。

model_length_termination标记的消息不拦截。

长度封顶的回合已经被终端化。

再次介入只会把同样的超大工具调用重新塞进同一个上限。

第三步检查todos状态。

没有todos就放行。

全部completed就放行。

第四步检查提醒次数上限。

_MAX_COMPLETION_REMINDERS是2。

达到上限就放行模型退出。

上限防止模型无法推进时的无限循环。

第五步排队提醒并跳回model节点。

提醒不写进图状态。

提醒用wrap_model_call注入。

这样提醒不会泄露到用户可见的消息流。

### 4、提醒状态簿记

__init__初始化簿记结构。

_pending_completion_reminders存待注入的提醒。

键是thread_id加run_id的组合。

_completion_reminder_counts记录每个键已发提醒次数。

_completion_reminder_touch_order记录键的最近使用顺序。

_completion_reminder_next_order是递增序号。

这些结构用threading.Lock保护。

_MAX_COMPLETION_REMINDER_KEYS是4096。

4096是长期存活实例的簿记硬上限。

_prune_completion_reminder_state_locked方法做修剪。

修剪按最近使用顺序淘汰最旧的键。

当前运行的键受保护不被淘汰。

_queue_completion_reminder方法排队提醒。

_queue_completion_reminder方法累计计数。

_drain_completion_reminders方法取走待注入提醒。

before_agent钩子清理其他run的提醒。

清理逻辑是同线程不同run_id的键全部删掉。

新用户运行不该看到旧运行的提醒。

after_agent钩子清理当前run的提醒。

### 5、请求注入

_format_todos辅助函数把todos格式化成文本。

_format_completion_reminder辅助函数格式化未完成提醒。

_format_pending_completion_reminders方法合并多条提醒。

合并时用dict.fromkeys去重。

_augment_request方法把提醒注入ModelRequest。

wrap_model_call先调基类再注入提醒。

基类的wrap_model_call注入write_todos系统提示。

不调基类模型就永远不知道任务清单功能。

awrap_model_call是异步版本。

## 三、它和谁协作

这个中间件在lead-only中间件组里。

装配顺序排第22位。

这个中间件是可选的。

is_plan_mode开启时才装配。

这个中间件继承LangChain的TodoListMiddleware。

这个中间件和SummarizationMiddleware协作。

摘要压缩挤掉write_todos调用时这个中间件补提醒。

这个中间件和ModelLengthFinishReasonMiddleware协作。

长度封顶时这个中间件让路。

这个中间件的提醒通过deerflow_extension_api的canonical_hash声明release_policy。

这个中间件的todos状态被token_usage_middleware读取。

token_usage_middleware用todos生成write_todos的精确归因。

## 重要性评级

评级是6分。

理由如下。

计划模式是多步任务的核心体验。

任务清单让用户看到执行进度。

上下文丢失检测保证了长任务的连续性。

长任务必然触发摘要压缩。

没有提醒模型就会丢掉任务清单。

防止提前退出保证了任务真正做完。

不评8分以上的原因是这个中间件是可选功能。

is_plan_mode关闭时这个中间件完全不存在。

普通对话不经过这个中间件。

基类已经提供了核心的任务清单能力。

这个中间件只加了两个保护。

所以评级是6分。
