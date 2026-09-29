# IncompleteMessageRunLookupError-档案

## 一、这个类是干什么的

IncompleteMessageRunLookupError是runtime/events/store/base.py里的异常类。

它继承RuntimeError。

它在store不能证明一次目标查找是完整的时候抛出。

这个类位于backend/packages/harness/deerflow/runtime/events/store/base.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、继承关系

IncompleteMessageRunLookupError继承RuntimeError。

### 2、语义

事件store支持按message_ids查找run。

store必须能证明查找是完整的。

不能证明时抛它。调用者知道结果可能不完整。

### 3、配套的查找机制

normalize_message_ids规范化消息ID集合。

match_ai_message_run_id从事件里匹配AI消息的run_id。

事件里带message_ids集合时返回(run_id, message_id)。

## 三、它和谁协作

- RunEventStore的实现可能抛它。
- 消息feed的按消息查找消费它。

## 四、重要性评级

评级是3分。

理由如下。

这个类是事件store查找完整性的信号。

store不能证明完整时fail-loud。调用者不会误用不完整结果。

单行异常类。

扣掉7分。

扣分原因是它是单行异常类。无字段。
