# FeedbackRepository-档案

## 一、这个类是干什么的

FeedbackRepository是persistence/feedback/sql.py里的类。

它是反馈记录的持久仓库。

创建+1或-1的反馈记录。

rating必须是+1或-1。

这个类位于backend/packages/harness/deerflow/persistence/feedback/sql.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、create方法

创建反馈记录。

rating必须是+1或-1。否则ValueError。

带run_id、thread_id、user_id、message_id、comment、rating。

resolve_user_id解析用户。

### 2、_row_to_dict

created_at用coerce_iso规整。

SQLite丢tzinfo。输出总是tz-aware。

### 3、FeedbackRow

ORM行。feedback_id、run_id、thread_id、user_id、message_id、rating、comment。

## 三、它和谁协作

- FeedbackRow是ORM行。
- feedback路由消费。

## 四、重要性评级

评级是3分。

理由如下。

这个仓库是反馈记录的持久层。

rating验证。

SQLite时区规整。

扣掉7分。

扣分原因是它很小。逻辑直接。
