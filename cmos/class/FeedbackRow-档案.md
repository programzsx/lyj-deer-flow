# FeedbackRow-档案

## 一、这个类是干什么的

FeedbackRow是persistence/feedback/model.py里的ORM模型。

这个类是运行反馈的ORM行。

用户对运行的点赞或点踩反馈存这里。

每个(thread_id, run_id, user_id)一条反馈。

唯一约束强制一个用户对一次运行只有一条反馈。

message_id是可选的。

它允许反馈指向特定消息或整个运行。

这个类位于backend/packages/harness/deerflow/persistence/feedback/model.py。

## 二、类的成员（字段、方法，各自做什么）

字段如下。

- feedback_id是主键。String(64)。
- run_id是运行id。可空为否。有索引。
- thread_id是会话id。可空为否。有索引。
- user_id是用户id。可为None。有索引。
- message_id是可选的RunEventStore事件标识。让反馈指向特定消息或整个运行。
- rating是评分。可空为否。+1是点赞。-1是点踩。
- comment是可选的文字反馈。Text类型。
- created_at是创建时间。带时区。自动生成。

表级约束是uq_feedback_thread_run_user。

这是(thread_id, run_id, user_id)的唯一约束。

它继承Base。有to_dict。

## 三、它和谁协作

- FeedbackRepository读写这个模型。
- persistence/base的Base提供序列化。
- Gateway的feedback路由消费。

## 四、重要性评级

评级是4分。

理由如下。

这个模型是用户反馈的存储行。

唯一约束防止重复反馈。

message_id让反馈能指向特定消息。

但它是纯ORM模型。

只有字段。

扣掉6分。
