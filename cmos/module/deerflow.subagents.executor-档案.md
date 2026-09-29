# deerflow.subagents.executor-档案

## 一、这个模块是干什么的

这个模块是子代理执行引擎。是整个子代理系统的核心。

主代理委派任务给子代理时。task工具调用SubagentExecutor。executor负责把子代理跑起来。收集结果。处理取消。处理超时。处理LLM失败。

它管理一个持久隔离事件循环。子代理在这个循环里执行。不占用主代理的循环。

它处理很多边界。检查点隔离。上下文复制。令牌收集。步骤捕获。收据收割。守卫上限。沙箱租约释放。扩展通知。

## 二、模块里的主要成员

### 1、SubagentStatus枚举

子代理执行的状态。有六个值。PENDING、RUNNING、COMPLETED、FAILED、CANCELLED、TIMED_OUT。

is_terminal属性判断是否终态。终态是COMPLETED、FAILED、CANCELLED、TIMED_OUT四种。

### 2、SubagentResult数据类

结果对象。字段有task_id、trace_id、status、external_task_id、result、error、stop_reason、started_at、completed_at、ai_messages、token_usage_records、usage_reported、admission_failure、tool_receipts、bash_executions、cancel_event、_state_lock。

task_id是服务器生成的标识。拥有这次执行。

external_task_id是可选的供应商关联ID。它和task_id分开。因为供应商tool-call ID可以跨父运行重复。

stop_reason说明哪个守卫上限提前结束了运行。token_capped、turn_capped、loop_capped。有上限的运行保持正常状态。产出了可用输出的是completed。没产出的是failed。

tool_receipts是从终态消息流收割的子代理工具收据。

bash_executions是有界的bash命令和输出证据。让主代理把tests_passed验收叶子锚到具体的记录执行。

update_token_usage_records在运行时发布最新累计collector快照。update_tool_receipts发布最新yield状态的收据。update_bash_executions合并bash证据。合并按tool_call_id。封顶最新20条。None不动。空列表也发布。

try_set_terminal设置终态一次。后台超时取消和执行worker可能在同一个result上竞争。第一次终态转换赢。晚到的终态写入不改变状态或载荷字段。

### 3、结果提取函数

_extract_final_result从流式终态提取人类可读结果。找最后一条AIMessage。用message_content_to_text转字符串。没有AIMessage用最后一条消息。没有消息返回"No response generated"哨兵。

_extract_llm_error_fallback返回终态LLM回退消息的用户可见错误。LLMErrorHandlingMiddleware把供应商异常转成标记的AIMessage。让图能干净终止。干净的图终止不是任务成功。executor把这个标记翻译成FAILED终态。

只看最后一条助手消息是故意的。子代理共享父thread_id。LangGraph通过values模式重发完整父历史。final_state可能带早前轮次的陈旧回退标记。回退AIMessage不带tool_calls。所以它总是终止运行。最后一条AIMessage永远不是陈旧的父历史标记。

### 4、收据和bash证据收割

_harvest_tool_receipts从终态消息流收割子代理工具收据。懒导入。失败隔离。收割错误不能改变运行结果。

_harvest_bash_executions从一个流式状态收割有界bash命令和输出证据。每条带shell_persistent来源戳。产生证据的沙箱的persistent_shell_sessions标志。

_bash_evidence_status从shell退出标记推导记录状态。非零退出不抛异常。本地沙箱在输出末尾追加Exit Code: N。远程提供者输出Command exited with code N。显式标记权威。元状态只是回退。

_harvest_shell_persistence从证据所在状态解析persistent_shell_sessions。从状态里解析而不是父任务运行时。父运行时在委派前没碰沙箱时没有sandbox键。None时消费者失败关闭。

### 5、持久隔离事件循环

_isolated_subagent_loop是进程级持久事件循环。复用一个长寿循环避免每次执行建新循环。新循环关闭时绑定的异步资源会出问题。

_get_isolated_subagent_loop获取或创建循环。循环在daemon线程里跑run_forever。

_shutdown_isolated_subagent_loop在atexit时停止并关闭。

_submit_to_isolated_loop_in_context在保留ContextVar状态的情况下提交协程。循环在协程创建之前解析。直接传协程的话。循环启动失败会留下一个创建但从未调度的协程。被拒绝的协程被关闭。

run_on_isolated_subagent_loop把协程调度到进程拥有的持久循环。与在调用者循环上create_task不同。这里提交的工作在短命调用者循环拆除后仍然存活。

_copy_isolated_subagent_context复制环境上下文。去掉循环绑定的父图回调。检查点lineage、运行时元数据、用户身份、追踪上下文保留。RunJournal带deerflow_loop_bound标记。跨循环会导致重复记账和"Future attached to a different loop"失败。框架流回调保留。这样命名空间的子token帧继续到达父流。

### 6、SubagentExecutor类

executor本身。构造参数非常多。config、tools、app_config、parent_model、sandbox_state、thread_data、uploaded_files、thread_id、trace_id、user_id、user_role、oauth_provider、oauth_id、run_id、channel_user_id、is_internal、authz_attributes、deerflow_trace_id、knowledge_scope、extensions、execution_capacity、acceptance_criteria、loop_detection_recorder、tool_promotion_recorder、tool_progress_recorder、context_snapshot、thread_incarnation。

构造函数做几件事。过滤工具。解析模型名。深拷贝上传文件。解析trace id。规范化授权属性。解析deerflow_trace_id。初始化基础状态。

_get_resolved_app_config返回这次执行用的单一AppConfig快照。缓存一次。延迟解析。

_create_agent创建代理实例。建模型。建中间件。建图。checkpointer为False。子代理是一次性的。不恢复。不继承父检查点。

_build_initial_state构建初始状态。加载技能。构建技能搜索设置。应用授权过滤。组装延迟工具。合并系统提示。构建消息。

系统提示分几部分合并成一条SystemMessage。配置的系统提示。快照注记。报告契约。验收标准注记。技能段。延迟工具段。MCP路由提示段。

_aexecute执行。先获取容量slot。容量错误转成admission_failure。然后调用_aexecute_admitted。

_aexecute_admitted是主执行流程。发扩展任务开始通知。构建初始状态。建代理。建collector。构建run_config。注入追踪。构建运行上下文。开始流式。处理取消。捕获步骤。终态后提取结果。

流式循环里做几件事。保留final_state。发布收据。发布bash证据。检查协作取消。发布token用量。捕获步骤消息。

finally里释放沙箱租约。发扩展任务停止通知。

GraphRecursionError处理。max_turns用尽。恢复部分结果。有可用部分输出的是completed。没有的是failed。都带stop_reason。

execute同步执行。包装异步执行。在持久隔离循环上跑。

execute_async后台执行。返回唯一执行ID。注册到_background_tasks。submitting失败时从注册表移除刚注册的条目。防止PENDING僵尸。

### 7、后台任务注册表

_background_tasks是全局结果存储。带锁。

request_cancel_background_task发取消信号。设置cancel_event。协作检查在astream迭代边界。设置cancel_event后调用future.cancel。cancel在锁外调用。因为取消可能同步调完成回调。回调会拿同一把锁。

get_background_task_result读取结果。

list_background_tasks列出全部。

cleanup_background_task清理完成的任务。只清理终态的。防止和还在更新的后台executor竞争。

force_cleanup_background_task无条件清理。最后手段。

### 8、MAX_CONCURRENT_SUBAGENTS

默认并发数。3。

## 三、它和谁协作

task_tool调用executor的execute和execute_async。

capacity提供执行容量控制。

registry提供子代理配置。

token_collector收集token用量。

step_events捕获步骤消息。

report_contract提供报告契约文本。

context_snapshot提供父上下文快照。

acceptance_checks消费收割的bash执行证据。

status_contract定义结果元数据契约。

它依赖agents的中间件和线程状态。依赖models的create_chat_model。依赖skills的存储和describe。依赖tracing。依赖trace_context。依赖sandbox的租约。

## 四、重要性评级

评级是10分（满分10分）。

理由：

executor是子代理系统的核心。子代理委派的一切都经过它。建图、执行、流式、取消、超时、LLM失败、收据、bash证据、token记账、步骤捕获、检查点隔离、上下文隔离、循环隔离、沙箱租约。全在这里。

它处理了大量并发和隔离边界。持久隔离事件循环。ContextVar复制。回调过滤。检查点lineage。沙箱租约释放。后台任务注册表。

每个细节都有注释解释为什么这样设计。为什么只看最后一条助手消息。为什么取消在锁外。为什么提交失败要移除注册。为什么强制清理存在。

它是子代理委派的唯一执行路径。坏了所有委派都失败。复杂度极高。防御密度极高。给10分。
