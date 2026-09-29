# TokenUsageMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/token_usage_middleware.py`

## 一、这个类是干什么的

TokenUsageMiddleware记录token用量并标注步骤归属。

它做两件事。

第一件是从模型响应里读token用量。记成指标。

第二件是标注AI步骤。子代理的终端用量在当前运行的ToolMessage.additional_kwargs里。
这个中间件把它读出来。按消息位置合并回派发的AIMessage。

同一次状态更新还会给ToolMessage盖上`subagent_token_usage_attributed=true`标记。
这样checkpoint重放或中间件重入不会把累计快照加两次。

缺失或格式坏的用量。或者找不到匹配派发的结果。保持不标记。可以重试。

## 二、类的成员

### （一）字段

没有声明公开字段。

### （二）方法

钩子方法是重点。

- `after_model`和`aafter_model`：模型响应之后读用量。标注AI步骤。回填子代理用量。

辅助方法：

- `_apply`：执行用量读取和标注的主逻辑。

## 三、它和谁协作

- 它挂在中间件链上。在TokenBudgetMiddleware之前。
- TokenBudgetMiddleware依赖它回填的用量做预算判断。
- 子代理执行器产生的终端ToolMessage是它的数据来源。

## 四、重要性评级

评级：6/10。

理由：用量归集是预算控制和成本观测的地基。没有它子代理的消耗是黑洞。去重标记保证了重放安全。但它自己不做任何控制。只是采集。所以给6分。