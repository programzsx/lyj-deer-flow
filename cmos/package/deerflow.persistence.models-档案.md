# deerflow.persistence.models-档案

源码路径：backend/packages/harness/deerflow/persistence/models/__init__.py

## 一、这个包是干什么的

这个包是ORM模型注册入口。

这个包自己不实现存储逻辑。

这个包做一件事。

这件事是把所有ORM模型导入到Base.metadata。

模型注册后Alembic autogenerate才能检测到每张表。

实际存储实现都在别的包里。

这个包在model层面是全部表的汇总点。

## 二、包里的主要成员

（1）__init__.py的导入清单

这个模块从各个实体子包导入所有Row类。

导入的模型如下。

AgentRow来自deerflow.persistence.agents。

agents表。

ChannelConnectionRow、ChannelConversationRow、ChannelCredentialRow、ChannelOAuthStateRow来自channel_connections。

四张渠道表。

FeedbackRow来自deerflow.persistence.feedback。

feedback表。

ManagedSubagentRow来自managed_subagents。

managed_subagents表。

McpTaskRow来自mcp_tasks。

mcp_tasks表。

RunEventRow来自本包的run_event模块。

run_events表。

PersonalAccessTokenRow来自personal_access_tokens。

personal_access_tokens表。

ProjectDocumentRow、ProjectRow来自projects。

projects和project_documents表。

RunChangeClockRow、RunRow来自run。

runs和run_change_clock表。

ScheduledTaskRunRow来自scheduled_task_runs。

scheduled_task_runs表。

ScheduledTaskRow来自scheduled_tasks。

scheduled_tasks表。

SubagentBatchItemRow、SubagentBatchRow来自subagent_batches。

subagent_batches和subagent_batch_items表。

ThreadMetaRow来自thread_meta。

threads_meta表。

UserPreferenceRow、UserRow来自user。

user_preferences和users表。

WebhookDeliveryRow来自webhook_delivery。

webhook_deliveries表。

（2）run_event.py的RunEventRow

RunEventRow对应run_events表。

一行代表一个run事件。

字段如下。

id是自增主键。

thread_id和run_id标识事件归属。

user_id是会话属主。

user_id可为空。

空代表引入auth之前的数据。

event_type是事件类型。

category是事件类别。

类别的值和语义由runtime/events/catalog.py定义。

content是事件内容文本。

event_metadata是事件元数据JSON。

seq是事件序号。

created_at是创建时间。

(thread_id, seq)上有UNIQUE约束。

一个thread内序号不重复。

还有两个索引。

索引是(thread_id, category, seq)和(thread_id, run_id, seq)。

RunEventRow留在这个包里。

因为它的存储实现在deerflow.runtime.events.store.db。

它没有对应的实体目录。

## 三、它和谁协作

bootstrap.py引导schema时依赖这个注册入口。

Base.metadata.create_all需要所有模型已注册。

Alembic autogenerate也需要。

migration 0001_baseline和这个清单对应。

bootstrap的_BASELINE_TABLE_NAMES由守卫测试钉住。

存储实现在runtime包里的只有run_events。

其余模型的仓库在各自的实体子包。

## 四、重要性评级

评级：7分。

理由：

这个包是schema完整性的关键点。

漏导一个模型那一张表就不会被创建。

表缺失会让第一个请求500。

run_events是核心事件流数据的模型。

但这个包本身只是导入清单。

逻辑几乎为零。

所以给7分。
