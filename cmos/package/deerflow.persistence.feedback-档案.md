# deerflow.persistence.feedback-档案

源码路径：backend/packages/harness/deerflow/persistence/feedback/__init__.py

## 一、这个包是干什么的

这个包负责用户对run的反馈的持久化。

用户在界面上对某次回答点赞或点踩。

点赞是+1，点踩是-1。

用户还可以写一段文字评论。

这个包存这些反馈。

这个包对应数据库里的feedback表。

## 二、包里的主要成员

（1）model.py的FeedbackRow

FeedbackRow对应feedback表。

一行代表一条反馈。

字段如下。

feedback_id是主键。

feedback_id是uuid字符串。

run_id是哪次run。

run_id有索引。

thread_id是哪个会话。

thread_id有索引。

user_id是谁评的。

user_id有索引。

message_id是可选的事件标识。

message_id允许反馈针对某条具体消息。

不带message_id就是针对整个run。

rating是评分。

rating只能是+1或-1。

comment是可选的文字反馈。

created_at是创建时间。

(thread_id, run_id, user_id)上有UNIQUE约束。

一个用户对一个run只有一条反馈。

（2）sql.py的FeedbackRepository

每个方法都获取并释放自己的短命session。

方法如下。

create创建一条反馈。

rating必须是+1或-1。

其他值会抛ValueError。

get按feedback_id查一条。

带owner过滤。

别人的反馈查不到。

list_by_run列出一个run的所有反馈。

list_by_thread列出一个thread的所有反馈。

delete按feedback_id删一条。

带owner过滤。

upsert创建或更新反馈。

按(thread_id, run_id, user_id)找已有行。

找到就更新rating和comment。

找不到就插入新行。

用户改主意再点一次就更新原记录。

delete_by_run删除当前用户对一个run的反馈。

delete_by_thread删除一个thread的所有反馈。

user_id遵循三态约定。

AUTO解析请求上下文。

显式id限定属主。

None删除所有属主的行。

None只给迁移和CLI用。

list_by_thread_grouped按run_id分组返回。

返回形式是{run_id: feedback_dict}。

未过滤读时多个用户可能评同一个run。

分组时保留每个run最后写的那条。

feedback_id用来打破平局。

排序是确定性的。

list_by_run_ids只返回选中run的反馈。

aggregate_by_run做数据库端计数。

返回total、positive、negative三个数。

计数用SQL的SUM加CASE完成。

## 三、它和谁协作

Gateway的deps.py构造这个仓库。

反馈相关的HTTP路由调用它。

run完成或删除时会连带处理反馈。

删除thread时会用delete_by_thread清理。

这个仓库依赖engine.py的session工厂。

owner过滤依赖deerflow.runtime.user_context。

## 四、重要性评级

评级：3分。

理由：

反馈是边缘数据。

反馈记录用户的评价。

反馈不参与任何运行核心路径。

反馈丢了不影响run执行。

反馈丢了不影响thread管理。

反馈只服务于产品改进和统计。

所以这个包是低分的3分。
