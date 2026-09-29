# deerflow.persistence.feedback.model-档案

## 一、这个模块是干什么的

这个模块定义用户对运行结果反馈的ORM模型。

模型类叫FeedbackRow。

模型对应数据库里的feedback表。

用户可以对一次run点赞或点踩。

用户还可以留一句文字评论。

这些反馈存在feedback表里。

## 二、模块里的主要成员

### 1、FeedbackRow类

FeedbackRow继承自Base。

FeedbackRow对应feedback表。

#### （1）feedback_id列

feedback_id是主键。

feedback_id是字符串。

长度64。

#### （2）run_id列

run_id是这次反馈针对的运行。

run_id有索引。

run_id不允许为空。

#### （3）thread_id列

thread_id是反馈所在的线程。

thread_id有索引。

thread_id不允许为空。

#### （4）user_id列

user_id是提交反馈的用户。

user_id有索引。

user_id允许为空。

为空对应引入鉴权之前的历史数据。

#### （5）message_id列

message_id是可选的事件标识。

message_id指向RunEventStore的某个事件。

message_id允许为空。

为空表示反馈针对整个run。

不为空表示反馈针对某条具体消息。

#### （6）rating列

rating是评分。

rating不允许为空。

rating只接受两个值。

两个值是+1和-1。

+1代表点赞。

-1代表点踩。

#### （7）comment列

comment是可选的文字反馈。

comment是Text类型。

#### （8）created_at列

created_at是创建时间。

时区是UTC。

#### （9）唯一约束

表有唯一约束(thread_id, run_id, user_id)。

约束名叫uq_feedback_thread_run_user。

一个用户对一个run只能有一条反馈。

重复提交走upsert更新而不是插入。

## 三、它和谁协作

### 1、它依赖谁

它依赖deerflow.persistence.base的Base。

### 2、谁依赖它

feedback/sql.py的FeedbackRepository用FeedbackRow读写行。

migrations/versions/0001_baseline.py创建feedback表的baseline部分。

bootstrap.py的canonical-0019 floor列出这张表的列。

## 四、重要性评级

评级是5分。

理由如下。

用户反馈功能的数据全靠这张表。

唯一约束保证了反馈的幂等性。

message_id的设计让反馈可以精确到消息。

扣分的原因是这张表结构简单。

九个列没有复杂关系。

反馈是辅助功能。

反馈不参与核心运行链路。
