# RunEventRow-档案

## 一、这个类是干什么的

RunEventRow是persistence/models/run_event.py里的ORM模型。

它映射run_events表。

持久化运行事件。

这个类位于backend/packages/harness/deerflow/persistence/models/run_event.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、RunEventRow字段

id是自增主键。

thread_id和run_id是String 64。

user_id是所有者。可空。

auth引入之前的数据可空。

新写由auth middleware填充。

已有行由启动时孤儿迁移填充。

event_type是String RUN_EVENT_TYPE_MAX_LENGTH。

category是String RUN_EVENT_CATEGORY_MAX_LENGTH。

类目值和语义由runtime/events/catalog.py定义。

content是Text。

event_metadata是JSON。

seq是非空整数。

created_at带时区。

### 2、表约束

uq_events_thread_seq是(thread_id, seq)唯一约束。

每线程的seq唯一。

ix_events_thread_cat_seq索引按类目查。

ix_events_run索引按run查。

## 三、它和谁协作

- DbRunEventStore读写这个表。
- RunJournal产生事件。
- runtime/events/catalog.py定义event_type和category语义。

## 四、重要性评级

评级是6分。

理由如下。

RunEventRow是持久事件的ORM映射。

唯一约束防重复seq。

三个索引支撑查询路径。

user_id的孤儿迁移填充。

这些是多实例事件持久化的关键。

扣掉4分。

扣分原因是它是薄ORM行。
