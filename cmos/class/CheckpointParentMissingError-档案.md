# CheckpointParentMissingError档案

来源文件：`backend/app/gateway/checkpoint_lineage.py`

## 一、这个类是干什么的

这个类是检查点父链接缺失异常。

这个类继承自`CheckpointLineageError`。

这个类表示一个旧检查点没有记录父链接。

沿lineage向上走靠的是检查点的`parent_config`链接。

`parent_config`不是字典时，向上走就断了。

这时候抛这个类。

这个类的存在让调用方知道失败原因是"链接缺失"，而不是"链接损坏"。

两种失败的处理方式不同。

链接缺失通常出现在导入的或旧版本的检查点上。

这类检查点应该走时间序扫描的兼容回退路径，而不是直接失败。

## 二、类的成员

这个类没有自定义字段和方法。

这个类完全继承`CheckpointLineageError`的行为。

这个类通过异常消息表达"lineage在目标消息之前就结束了"。

## 三、它和谁协作

这个类由`find_checkpoint_before_message()`在父配置缺失时抛出。

消费方是回放准备路由。

路由捕获这个异常后可以决定是否退回时间序扫描路径。

这个类和`CheckpointLineageIntegrityError`是兄弟类。

兄弟类的分工是区分"缺失"和"损坏"两类失败。

## 四、重要性评级

评级：4分。

理由：这个类是lineage失败分类的一部分。缺失场景和损坏场景的后续处理不同，这个类就是区分两者的标签。但这个类只有一个抛出点，结构极小。所以这个类是小众的分类异常类。
