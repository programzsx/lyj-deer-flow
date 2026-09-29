# SummaryGenerationError档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/summarization_middleware.py`

## 一、这个类是干什么的

SummaryGenerationError表示摘要生成在用尽运行模型回退之后仍然失败。

这个异常只在调用方选择抛出时才抛。
选择方式是`raise_on_failure`参数。
手动`/compact`路径用这个。

真正的失败要和"没有可压缩的东西"区分开。
用户手动点压缩。失败了应该看到明确的错误。
而不是看到一条"没什么可压缩的"。

自动压缩路径不抛。raise_on_failure为False。
失败被吞掉。压缩状态本轮不变。
下一轮触发时再试。

## 二、类的成员

### （一）字段

没有额外字段。继承RuntimeError。

### （二）方法

- `__init__`：构造异常。继承自RuntimeError。

## 三、它和谁协作

- DeerFlowSummarizationMiddleware的compact_state在raise_on_failure为true时抛出它。
- Gateway的compact路由捕获它。把明确的错误返回给用户。

## 四、重要性评级

评级：3/10。

理由：SummaryGenerationError是手动压缩路径的失败信号。它让失败可区分。自动路径不受它影响。体积小。所以给3分。