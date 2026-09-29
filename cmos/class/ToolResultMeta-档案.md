# ToolResultMeta档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/tool_result_meta.py`

## 一、这个类是干什么的

ToolResultMeta是工具结果的统一语义元数据。

每张经过ToolErrorHandlingMiddleware的工具结果都带一条`deerflow_tool_meta`。
这个类就是那条元数据的形状。

下游消费者读这个键。不再解析结果文本。
文本解析脆弱。结构化元数据可靠。

它回答四个问题。

结果状态是什么。
如果出错了。错误类型是什么。
模型能不能自己恢复。
推荐的下一步动作是什么。
这条元数据是从哪来的。

## 二、类的成员

### （一）字段

- `status`：结果状态。ToolResultStatus枚举。
- `error_type`：错误类型。成功时为None。
- `recoverable_by_model`：模型能否通过重试或换策略自行恢复。
- `recommended_next_action`：推荐的下一步动作。RecommendedNextAction枚举。
- `source`：元数据来源。取值exception、tool_return、content_analysis、progress_middleware。

### （二）方法

ToolResultMeta没有定义自己的方法。
它是纯数据。

## 三、它和谁协作

- ToolErrorHandlingMiddleware盖它。
- ToolProgressMiddleware消费它驱动停滞状态机。
- normalize_tool_result函数构造它。

## 四、重要性评级

评级：6/10。

理由：ToolResultMeta是工具结果语义的结构化基础。恢复判定和下一步动作让下游守卫能做出正确决策。没有它下游只能解析文本。它是数据类。逻辑在生产者和消费者里。所以给6分。