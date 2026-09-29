# _RawCheckpointReadAccessor档案

来源文件：`backend/app/gateway/services.py`

## 一、这个类是干什么的

这个类是降级的检查点读取访问器。

这个类的使用场景是agent工厂挂了。

agent工厂挂掉的典型原因有模型配置错误、MCP服务器宕机、技能配置错误。

普通读取路径需要编译好的agent图。

这个类不需要编译图。

full模式检查点持久化了完整的`channel_values`，所以只读检查点元组就能拿到状态。

这个类就是直接读原始检查点的降级路径。

这个类保证state读取端点在工厂故障时仍然可用。

这个类是fail-closed的。

delta模式检查点会被这个类直接拒绝。

拒绝时抛`CheckpointModeMismatchError`。

delta模式的物化需要图的channel表，没有降级路径可言。

这个类也不支持写操作。变更路径必须用图支持的访问器。

## 二、类的成员

### 1、构造函数和字段

构造函数接收两个参数。

第一个参数是`checkpointer`，这是LangGraph的检查点保存器。

第二个参数是`mode`，这是当前的检查点通道模式。

两个参数都存到实例的同名属性上。

### 2、方法_gate

`_gate`是静态方法。

`_gate`检查检查点元组是否使用delta模式。

delta模式检查点会被抛错拒绝。

### 3、方法aget

`aget`接收一个config字典。

`aget`调用`checkpointer.aget_tuple()`拿原始检查点。

`aget`先用`_gate`做模式门禁。

`aget`返回一个`_RawCheckpointSnapshot`对象。

### 4、方法ahistory

`ahistory`返回检查点历史列表。

`ahistory`处理了一个边界差异。

Pregel的`get_state_history`把config里的`checkpoint_id`当作包含式起点。

`alist(before=...)`是排除式的。

所以`ahistory`会先显式取锚点检查点，再从锚点向后遍历。

这样降级路径的历史顺序和图路径保持一致。

## 三、它和谁协作

这个类由`build_checkpoint_state_accessor()`在agent工厂装配失败时返回。

这个类消费的是LangGraph checkpointer的`aget_tuple()`和`alist()`接口。

这个类产出`_RawCheckpointSnapshot`对象。

这个类的消费方是state读取端点。

这个类和正常的`CheckpointStateAccessor`形成降级对照关系。

## 四、重要性评级

评级：6分。

理由：这个类是状态读取端点的可用性兜底。没有这个类，一次糟糕的技能配置或模型配置就会让所有state读取端点500。这个类还守住了delta模式的fail-closed门禁，防止把残缺状态当完整状态发给客户端。但这个类只覆盖full模式，且只读。所以这个类是重要的容错组件。
