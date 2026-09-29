# RunRecord档案

源码位置：backend/packages/harness/deerflow/runtime/runs/manager.py

## 一、这个类是干什么的

RunRecord是单个运行的内存记录类。

RunRecord保存一个运行的全部可变状态。

RunRecord的内容包括基本身份信息、生命周期状态、取消控制、token统计、所有权信息。

RunRecord是可变的。类声明没有用frozen。运行推进过程中各处会就地更新这个对象。

RunRecord分两种形态。一种是本worker接纳的活跃运行。另一种是`store_only`快照。快照从store行映射而来。快照是只读的。快照不会被注册进`_runs`。

## 二、类的成员

（一）身份与配置字段

- `run_id`：运行的唯一ID。
- `thread_id`：所属线程的ID。
- `assistant_id`：使用的agent ID。可以为空。
- `status`：运行状态。类型是RunStatus。
- `on_disconnect`：SSE断开时的行为。类型是DisconnectMode。
- `operation_kind`：线程操作类型。类型是ThreadOperationKind。默认是run。
- `multitask_strategy`：多任务策略。默认是reject。
- `metadata`和`kwargs`：元数据和参数字典。
- `user_id`：运行属主用户。
- `model_name`：模型名。
- `created_at`和`updated_at`：创建和更新时间戳。
- `idempotency_key`：进程级幂等键。

（二）取消控制字段

- `task`：运行对应的asyncio任务。取消时cancel这个任务。
- `start_lock`：asyncio锁。串行化启动过程。防止一个运行被交给多个worker路径。
- `abort_event`：取消事件。设置后运行应该中止。
- `abort_action`：取消动作。默认是interrupt。
- `finalizing`：是否在做事后清理。
- `ownership_lost`：进程内围栏信号。设置后本worker不得再做durable收尾。因为租约所有权已经丢失或无法确认。

（三）结果与统计字段

- `error`：错误信息。
- `stop_reason`：停止原因。
- `total_input_tokens`、`total_output_tokens`、`total_tokens`：token统计。
- `llm_call_count`：LLM调用次数。
- `lead_agent_tokens`、`subagent_tokens`、`middleware_tokens`：按调用方归因的token。
- `token_usage_by_model`：按模型细分的token用量。
- `message_count`：消息数。
- `last_ai_message`和`first_human_message`：首尾消息内容。

（四）所有权字段

- `owner_worker_id`：持有这个运行的worker ID。
- `lease_expires_at`：租约到期时间。
- `store_only`：True表示这是从store映射来的只读快照。
- `idempotency_reused`：True表示这个调用方复用了已有的幂等接纳。这个调用方不能给durable运行再挂第二个worker。

（五）方法

RunRecord是dataclass。RunRecord没有自定义方法。

## 三、它和谁协作

（一）RunManager

RunManager创建、持有、更新RunRecord。`_runs`字典保存活跃的RunRecord。`_record_from_store()`把store行映射成store_only的RunRecord。

（二）worker层

worker.py的run_agent接收一个RunRecord。运行过程中读写这个记录的状态和统计。

（三）RunStore

RunRecord的字段和store行字段一一对应。`_store_put_payload()`把记录序列化成store写入载荷。

## 四、重要性评级

评级：6分。

理由：RunRecord是运行状态的内存载体。取消、租约、token统计全靠这个对象传递。没有它，RunManager就没有管理的对象。但它本身只是数据容器。逻辑都在RunManager里。所以给6分。
