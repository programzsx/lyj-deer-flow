# ThreadCompactionResult档案

源码位置：`backend/packages/harness/deerflow/runtime/context_compaction.py`

## 一、这个类是干什么的

这个类是一个结果数据类。

这个类承载一次手动上下文压缩的结果。

用户可以手动触发压缩。

压缩可能成功。

也可能没有压缩。

比如消息太少。

比如`force=False`且没达到阈值。

这个类把结果表达成一个不可变的记录。

压缩了没有。

原因是什么。

删了多少条消息。

保留了多少条消息。

摘要更新了没有。

新检查点的id。

总token数。

这些信息一次返回。

调用方不用再查。

这个类用了`@dataclass(frozen=True)`。

frozen让实例不可变。

结果是既成事实的记录。

不应该被修改。

这个类的docstring写明。

它是"一次手动上下文压缩尝试后返回的结果"。

## 二、类的成员

### （一）字段

- `thread_id`：线程id。字符串。标识是哪个线程的压缩。
- `compacted`：是否真的压缩了。布尔值。False表示没有实际压缩。
- `reason`：没有压缩的原因。字符串或None。比如`not_enough_messages`表示消息不够。压缩成功时是None。
- `removed_message_count`：被摘要掉的消息数。整数，默认0。
- `preserved_message_count`：保留的消息数。整数，默认0。
- `summary_updated`：摘要是否更新了。布尔值，默认False。
- `checkpoint_id`：压缩后新检查点的id。字符串或None。
- `total_tokens`：摘要生成的总token消耗。整数，默认0。

### （二）方法

这个类没有方法。

dataclass自动生成`__init__`等方法。

frozen还自动生成`__hash__`和不可变保护。

这个类只承载数据。

## 三、它和谁协作

这个类和`compact_thread_context`协作。

压缩主流程构造并返回这个结果。

没有消息可压缩时。

返回`compacted=False`加`reason="not_enough_messages"`。

压缩成功时。

返回完整字段。

包括删了多少条、保留多少条、新checkpoint_id、总token。

这个类和Gateway的压缩路由协作。

路由把结果转成API响应返回给前端。

这个类和嵌入式的`DeerFlowClient`协作。

客户端方法返回这个结果给调用方。

## 四、重要性评级

评级：4分（满分10分）。

理由：

- 这个类是纯数据类。
- 没有任何逻辑。
- 它是手动压缩API的结果契约。
- 字段覆盖了压缩的全部关键信息。
- 调用方不需要再查就能知道压缩结果。
- frozen设计保证了结果不可变。
- 数据类评4到6分。
- 它是一个薄的结果载体。
- 逻辑在压缩主流程里。
- 评4分。
