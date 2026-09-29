# CheckpointLineageIntegrityError档案

来源文件：`backend/app/gateway/checkpoint_lineage.py`

## 一、这个类是干什么的

这个类是检查点lineage完整性异常。

这个类继承自`CheckpointLineageError`。

这个类表示lineage记录存在，但使用起来不安全。

"存在但不安全"是这个类和父类缺失场景的区别。

父类`CheckpointParentMissingError`表达的是链接缺失。

这个类表达的是链接在但内容可疑。

可疑的具体场景有五种。

第一种是目标消息不在检查头里。

第二种是父检查点解析不出来。

第三种是父检查点不存在。

第四种是父检查点的身份和请求的身份对不上。

第五种是lineage出现环。

第六种是扫描深度超过上限。

## 二、类的成员

这个类没有自定义字段和方法。

这个类完全继承`CheckpointLineageError`和`RuntimeError`的行为。

这个类通过异常消息区分具体的不安全原因。

消息例子包括目标消息不在头里、父链接不可寻址、lineage包含环、超过扫描上限。

## 三、它和谁协作

这个类由`find_checkpoint_before_message()`在四种情况下抛出。

这四种情况是父链接不可寻址、身份不匹配、检测到环、超过深度上限。

这个类也被`find_checkpoint_before_message_chronologically()`的调用方作为失败类型关注。

消费方是回放准备路由。

路由捕获这个异常后拒绝回放请求。

## 四、重要性评级

评级：4分。

理由：这个类是lineage安全判定的细分信令。完整性问题意味着lineage数据本身可疑，这时候继续回放会选错基座。这个类的存在让调用方可以区分"链接缺失"和"链接可疑"两种失败。但这个类是纯异常标签，没有逻辑。所以这个类是小而明确的内部异常类。
