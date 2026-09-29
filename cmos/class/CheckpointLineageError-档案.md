# CheckpointLineageError档案

来源文件：`backend/app/gateway/checkpoint_lineage.py`

## 一、这个类是干什么的

这个类是检查点lineage模块的基类异常。

这个类继承自`RuntimeError`。

这个类表示一个请求的检查点祖先无法安全解析。

无法安全解析的场景有很多。

目标消息不在检查点头里是场景。

父链接不可寻址是场景。

lineage出现环是场景。

扫描超过深度上限是场景。

这个类是模块内另外两个异常的父类。

子类分别表达更具体的失败原因。

检查点回放功能靠这个异常家族做fail-closed判断。

lineage解析不安全就拒绝回放，绝不选一个错误的检查点当回放基座。

## 二、类的成员

这个类没有自定义字段和方法。

这个类只继承`RuntimeError`的默认行为。

这个类通过异常消息传递失败原因。

### 1、子类CheckpointParentMissingError

这个子类表示旧检查点没有记录父链接。

没有父链接就无法沿lineage向上走。

### 2、子类CheckpointLineageIntegrityError

这个子类表示lineage记录存在但使用起来不安全。

不安全的例子包括父链接对不上、出现环、目标消息不在头里、超过扫描上限。

## 三、它和谁协作

这个类由`find_checkpoint_before_message()`抛出。

这个类也被`find_checkpoint_before_message_chronologically()`的调用方关注。

消费方是Gateway的回放准备路由。

回放准备路由（regenerate prepare和edit-regenerate prepare）捕获这个异常家族。

捕获后把失败映射成HTTP错误。

这个类的判定依赖同模块的`checkpoint_messages()`、`is_duration_only_checkpoint()`、`has_pending_tasks()`等辅助函数。

## 四、重要性评级

评级：5分。

理由：这个类是检查点回放安全边界的信令载体。回放基座选错会重放错误的对话状态，所以lineage解析必须fail-closed。这个类和子类就是那个fail-closed的异常表达。但这个类本身没有字段和逻辑，只是分类标签。所以这个类是安全边界里简单但关键的部分。
