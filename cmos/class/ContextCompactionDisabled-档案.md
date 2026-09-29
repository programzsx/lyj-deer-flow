# ContextCompactionDisabled档案

源码位置：`backend/packages/harness/deerflow/runtime/context_compaction.py`

## 一、这个类是干什么的

这个类是一个异常类。

这个类继承`RuntimeError`。

这个类表示"上下文压缩被禁用"。

用户可以手动触发上下文压缩。

入口是`POST /api/threads/{id}/compact`。

压缩依赖总结中间件。

总结功能可以在配置里禁用。

总结被禁用时。

用户又请求手动压缩。

代码抛出这个异常。

错误消息是"Context compaction is disabled."。

这个异常由`_create_compaction_middleware`抛出。

`create_summarization_middleware`发现总结功能没启用。

返回None。

`_create_compaction_middleware`看到None。

就抛这个异常。

## 二、类的成员

### （一）字段

这个类没有自己的字段。

它继承`RuntimeError`的全部行为。

异常消息通过标准的`args`传递。

### （二）方法

这个类没有自己的方法。

它只是继承异常类的行为。

定义这个类的意义在于类型本身。

调用方可以精确区分"功能禁用"和"压缩失败"。

功能禁用和压缩失败走不同的错误路径。

## 三、它和谁协作

这个类和`_create_compaction_middleware`协作。

创建中间件的函数在总结功能未启用时抛出这个异常。

这个类和`compact_thread_context`协作。

压缩主流程调用创建中间件的函数。

异常向上传播给调用方。

这个类和Gateway的压缩路由协作。

路由捕获这个异常。

映射成对应的HTTP错误响应。

前端显示相应提示。

## 四、重要性评级

评级：2分（满分10分）。

理由：

- 这个类是异常类。
- 没有任何逻辑。
- 只有一个docstring。
- 异常类评2到3分。
- 它承载的语义是"功能开关状态"。
- 区分"压缩功能没开"和"压缩执行失败"对前端提示有意义。
- 但异常类本身代码量几乎为零。
- 真正的判断逻辑在创建中间件的函数里。
- 评2分。
