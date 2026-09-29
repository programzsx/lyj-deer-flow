# RunChangeClockRow-档案

## 一、这个类是干什么的

RunChangeClockRow是persistence/run/model.py里的ORM模型。

它是单例计数器。

分配后端拥有的changed-run位置。

RunRepository的_next_change_seq用它。

变更时钟支撑增量同步。

这个类位于backend/packages/harness/deerflow/persistence/run/model.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、RunChangeClockRow字段

id是主键。固定为1。单例。

value是BigInteger计数。

default 0。server_default 0。

### 2、_next_change_seq的用法

OnConflictDoNothing初始化行。

UPDATE加value加1。RETURNING取位置。

### 3、RunRow对照

RunRow是runs表的ORM行。

字段包括run_id主键、thread_id、status、operation_kind、idempotency_key。

token用量字段。三维度。

lead_agent、subagent、middleware。

token_usage_by_model。

owner_worker_id、lease_expires_at是多worker所有权。

cancel_action和cancel_requested_at是取消协调。

非owning worker在这里记录取消。

owner在续租时消费。第一个行动赢。

change_seq是变更时钟位置。

uq_runs_thread_active部分唯一索引。

每线程最多一个pending或running run。

必须在ORM __table_args__里。

空DB bootstrap跑create_all加stamp head。

不执行定义这个索引的迁移。

## 三、它和谁协作

- RunRepository的_next_change_seq分配位置。
- RunRow带change_seq。
- 增量同步消费change_seq。

## 四、重要性评级

评级是5分。

理由如下。

RunChangeClockRow是变更时钟的单例行。

原子分配位置。

增量同步的基础。

RunRow的部分唯一索引必须在ORM里。

这些是多实例同步的关键。

扣掉5分。

扣分原因是它是单行计数器。
