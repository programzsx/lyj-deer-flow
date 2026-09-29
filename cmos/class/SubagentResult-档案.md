# SubagentResult档案

源码位置：backend/packages/harness/deerflow/subagents/executor.py

## 一、这个类是干什么的

SubagentResult是一次子Agent执行的结果。

SubagentResult承载执行的全部状态。状态、最终回答、错误、时间戳、AI消息、token用量、工具收据、bash证据都在这里。

SubagentResult的身份设计是刻意拆分的。task_id是服务器生成的标识。task_id拥有这次执行。external_task_id是可选的provider关联id。两者分开是因为provider的tool_call id可能在父运行之间重复。

stop_reason字段记录护栏上限。token_capped、turn_capped、loop_capped三种。干净的运行是None。被上限的运行保持正常状态。产出可用输出的是completed。没产出的是failed。上限原因带在stop_reason里。

SubagentResult的并发设计很严谨。try_set_terminal保证终结状态只设置一次。后台超时/取消和执行worker会在同一个结果持有者上竞争。第一个终结转换赢。迟到的终结写入不能改状态和载荷字段。

bash证据按chunk累积。累积按tool_call_id合并。这样摘要压缩早前消息不会抹掉记录的执行。

## 二、类的成员

（一）字段

- task_id：服务器生成的执行标识。
- external_task_id：provider关联id。
- trace_id：分布式追踪id。
- status：当前状态。SubagentStatus。
- result：最终结果消息。completed时有。
- error：错误消息。failed时有。
- stop_reason：护栏上限原因。
- started_at、completed_at：起止时间。UTC。
- ai_messages：执行期间生成的完整AI消息。
- token_usage_records：token用量记录。
- admission_failure：容量在执行前拒绝或超时。
- tool_receipts：子Agent的工具收据。
- bash_executions：有界的bash命令/输出证据。
- cancel_event：取消事件。

（二）方法

- update_token_usage_records：发布最新的累计用量快照。
- update_tool_receipts：发布收据。终结后不接受。
- update_bash_executions：合并bash证据。按tool_call_id合并。上限截断。
- snapshot_tool_receipts：复制最新发布的收据。
- try_set_terminal：只设置一次终结状态。返回是否成功。

## 三、它和谁协作

（一）产生者

SubagentExecutor产生SubagentResult。每个执行一个。

（二）消费者

进程级注册表_background_tasks持有结果。task工具轮询结果。事件持久化读状态。前端卡片消费task_*事件。

## 四、重要性评级

评级：8分。

理由：SubagentResult是子Agent执行的全部产出载体。它的并发设计（try_set_terminal、锁保护的更新）解决了真实的竞态问题。身份拆分（task_id和external_task_id）解决了provider id重复问题。stop_reason的附加式设计保持了向后兼容。给8分。
