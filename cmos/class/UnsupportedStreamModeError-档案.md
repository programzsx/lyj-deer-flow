# UnsupportedStreamModeError档案

源码位置：`backend/packages/harness/deerflow/runtime/stream_modes.py`

## 一、这个类是干什么的

这个类是一个异常类。

这个类继承`ValueError`。

这个类表示"调用方请求了DeerFlow不支持的流模式"。

运行时支持一组固定的流模式。

`values`、`messages-tuple`、`updates`、`debug`、`tasks`、`checkpoints`、`custom`。

这些定义在`RunStreamMode`类型别名里。

调用方请求别的模式时。

`normalize_stream_modes`抛出这个异常。

这个类有一个特点。

它在构造时收集所有不支持的模式。

而不是只报第一个。

构造函数接收模式列表。

用`dict.fromkeys`去重。

保持顺序。

存进`modes`字段。

错误消息列出所有不支持的模式。

一次告知全部问题。

调用方不用改一次试一次。

## 二、类的成员

### （一）字段

- `modes`：所有不支持的模式。元组。去重且保持顺序。这是这个类独有的字段。标准的ValueError没有这个字段。

### （二）方法

- `__init__`：接收模式列表。去重存进`modes`。构造错误消息。消息格式是"Unsupported stream mode(s): 后面跟逗号分隔的模式名"。然后调用父类构造。

这个类重写了`__init__`。

这是它和普通异常类的主要区别。

## 三、它和谁协作

这个类和`normalize_stream_modes`协作。

归一化函数发现不支持的模式。

抛出这个异常。

这个类和`to_langgraph_stream_modes`协作。

映射函数先调归一化。

不合法的模式在这里被拦下。

映射不做静默回退。

这个类和Gateway的流接口协作。

调用方请求流模式时先归一化。

不合法的请求得到显式错误。

而不是静默降级。

## 四、重要性评级

评级：2分（满分10分）。

理由：

- 这个类是异常类。
- 逻辑很少。
- 异常类评2到3分。
- 它有一点独有逻辑。
- 收集所有不支持的模式。
- 去重保序。
- 比普通异常类多做一点事。
- 它承载的语义是显式失败。
- 不支持的流模式不静默回退。
- 但整体仍然是薄异常类。
- 评2分。
