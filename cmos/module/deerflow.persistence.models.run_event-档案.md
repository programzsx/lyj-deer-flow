# deerflow.persistence.models.run_event-档案

## 一、这个模块是干什么的

这个模块定义运行事件的ORM模型。

模型类叫RunEventRow。

模型对应数据库里的run_events表。

运行事件是Agent运行过程中产生的结构化记录。

每条消息、每次工具调用都会产生事件。

事件持久化到run_events表。

前端的消息流靠这些事件重建。

## 二、模块里的主要成员

### 1、RunEventRow类

RunEventRow继承自Base。

RunEventRow对应run_events表。

表由alembic迁移0001_baseline创建。

#### （1）id列

id是主键。

id是自增整数。

和多数其他模型用uuid字符串不同。

事件量大且只追加。

自增整数适合这种场景。

#### （2）thread_id列

thread_id是事件所属的线程。

thread_id不允许为空。

#### （3）run_id列

run_id是事件所属的运行。

run_id不允许为空。

#### （4）user_id列

user_id是事件所属会话的拥有者。

user_id允许为空。

为空对应鉴权引入之前的数据。

新写入由auth中间件填充。

已有行由启动时的孤儿迁移填充。

user_id有索引。

#### （5）event_type列和category列

event_type是事件类型。

category是事件类别。

类别的值和语义由runtime/events/catalog.py定义。

两个列的长度由deerflow.constants的常量控制。

#### （6）content列

content是事件内容。

Text类型。

默认空字符串。

#### （7）event_metadata列

event_metadata是JSON元数据。

默认空字典。

#### （8）seq列

seq是事件在单个线程内的序号。

seq不允许为空。

#### （9）约束和索引

有唯一约束(thread_id, seq)。

约束名叫uq_events_thread_seq。

一个线程内序号不能重复。

这保证事件流的顺序是可靠的。

有索引(thread_id, category, seq)。

索引名叫ix_events_thread_cat_seq。

按类别取事件流走这个索引。

有索引(thread_id, run_id, seq)。

索引名叫ix_events_run。

按运行取事件走这个索引。

## 三、它和谁协作

### 1、它依赖谁

它依赖deerflow.persistence.base的Base。

它依赖deerflow.constants的长度常量。

### 2、谁依赖它

RunEventStore负责写入和读取RunEventRow。

写事件的存储实现在runtime/runs的event store里。

migrations/versions/0001_baseline.py创建这张表。

## 四、重要性评级

评级是7分。

理由如下。

运行事件的持久化全靠这张表。

前端消息流由这些事件重建。

序号唯一约束保证事件顺序可靠。

三个索引覆盖了事件读取的主要路径。

扣分的原因是它是纯模型文件。

没有读写逻辑。

逻辑在event store里。
