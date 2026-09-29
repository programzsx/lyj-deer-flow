# ContextCompactionFailed档案

源码位置：`backend/packages/harness/deerflow/runtime/context_compaction.py`

## 一、这个类是干什么的

这个类是一个异常类。

这个类继承`RuntimeError`。

这个类表示"可压缩的线程压缩失败"。

压缩流程会调用总结中间件生成摘要。

摘要由LLM生成。

LLM可能失败。

模型降级之后仍然失败。

这时抛出这个异常。

这个异常是有意设计的路径区分。

"没有消息可压缩"和"摘要生成失败"是两种不同的结果。

没有消息可压缩返回`compacted=False`的结果。

原因字段是`not_enough_messages`。

这个结果读起来像"不需要压缩"。

摘要生成失败是真失败。

不能用`compacted=False`表达。

否则前端会把真失败当成"不需要压缩"。

所以代码捕获`SummaryGenerationError`。

重新包装成这个异常。

让它走HTTP 500路径。

前端显示错误提示。

代码里还有一行注释说明。

`raise_on_failure`和`force`是独立的。

手动调用方总是想让生成失败显式抛出。

即使force=False的调用。

## 二、类的成员

### （一）字段

这个类没有自己的字段。

它继承`RuntimeError`的全部行为。

异常消息通过标准的`args`传递。

### （二）方法

这个类没有自己的方法。

它只是继承异常类的行为。

定义这个类的意义在于类型本身。

调用方可以精确区分"压缩失败"和"不需要压缩"。

## 三、它和谁协作

这个类和`compact_thread_context`协作。

压缩主流程捕获`SummaryGenerationError`。

用`raise ... from exc`重新抛出这个异常。

保留原始异常链。

这个类和总结中间件协作。

`DeerFlowSummarizationMiddleware.acompact_state`在摘要生成失败时抛`SummaryGenerationError`。

这个类是那个错误的包装。

这个类和Gateway的压缩路由协作。

路由捕获这个异常。

映射成HTTP 500。

前端显示错误提示。

## 四、重要性评级

评级：2分（满分10分）。

理由：

- 这个类是异常类。
- 没有任何逻辑。
- 异常类评2到3分。
- 它承载的路径区分很重要。
- 真失败如果被表达成compacted=False。
- 前端会把失败当成"不需要压缩"。
- 用户得不到任何错误提示。
- 这个异常保证真失败走错误路径。
- 但异常类本身代码量几乎为零。
- 真正的判断和包装逻辑在压缩主流程里。
- 评2分。
