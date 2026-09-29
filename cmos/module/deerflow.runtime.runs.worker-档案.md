# deerflow.runtime.runs.worker

## 一、这个模块是干什么的

这个模块是后台代理执行的核心。

它把一个LangGraph代理图跑在一个asyncio任务里。

代理运行时产生的事件会发布到StreamBridge。

StreamBridge再把事件变成SSE推给客户端。

这个模块是整个系统里最大的单文件之一。

它管的事情非常多。

它管运行的完整执行循环。

它管流事件的打包与发布。

它管checkpoint的回滚与续写。

它管目标（goal）的持续追求。

它管工作区变更的记录。

它管运行历史的元数据持久化。

它还管终态清理，比如流关闭、引用释放、垃圾回收。

这个模块解决了很多历史上发现的真实缺陷。

比如delta模式的检查点恢复不能分叉，它在worker里线性化续跑。

比如旧运行的错误标记不能污染新运行，它用预存消息id集合屏蔽。

## 二、模块里的主要成员

- run_agent：核心入口。执行一次代理运行。它负责构建代理、预检、流循环、终态处理。
- RunContext：一次运行的基础设施依赖集合。包含checkpointer、store、event_store、thread_store、app_config等。打包成一个对象，避免参数列表无限膨胀。
- _SubagentEventBuffer：把子代理的步骤事件缓存起来，批量持久化。
- _MessageSeqStamper：给发布的消息打上线程全局的序列号。序列号帮客户端排序。
- _LargeFileToolChunkBatcher：把大文件工具的参数增量按有界批次发布。
- _capture_rollback_point和RollbackPoint：在运行开始前捕获完整状态。取消时可回滚到这个点。
- _linearize_delta_checkpoint_resume：delta模式下把恢复线性化。delta状态不能分叉恢复，所以把目标检查点的完整状态写到当前头部。
- _rollback_to_pre_run_checkpoint：取消时回滚到运行前的状态。
- persist_run_history_metadata、persist_run_durations：把运行时长和消息归属写进checkpoint元数据。
- _clear_completed_goal、_prepare_goal_continuation_input：目标完成评估与续跑输入准备。
- _ensure_interrupted_title：被打断的运行也要有标题。
- _publish_stream_item、_compose_sse_event：把LangGraph的流条目打包成SSE事件。
- _extract_llm_error_fallback_message：从历史里提取旧的错误回退消息，避免污染当前运行。
- _release_run_scoped_references：终态时释放运行持有的引用。
- _schedule_terminal_cycle_collection：运行结束后合并触发完整垃圾回收，控制堆内存下限。

## 三、它和谁协作

- 它依赖RunManager推进状态。
- 它依赖StreamBridge发布事件。
- 它依赖CheckpointStateAccessor读写检查点。
- 它依赖workspace_changes捕获和记录工作区变更。
- 它依赖runtime/goal读取和评估目标。
- 它依赖tracing注入Langfuse元数据。
- 它被app/gateway/services.py调用。Gateway的运行入口最终走到这里。

## 四、重要性评级

评级是10分。

理由是它就是"运行一个代理"这件事本身。

所有运行时行为都汇聚在这个文件里。

checkpoint回滚、delta线性化、目标续跑这些最难最关键的正确性逻辑都在这里。

它出错就是运行出错。
