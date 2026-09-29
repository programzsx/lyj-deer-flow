# EmptyModelResponseError档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/llm_error_handling_middleware.py`

## 一、这个类是干什么的

EmptyModelResponseError表示模型正常跑完但没有产出任何持久内容。

这个异常不是网络错误。也不是超时。

模型调用正常返回了。
但是返回里没有值得保存的内容。
比如空文本，或者只有被拦截掉的垃圾内容。

中间件用这个异常区分"模型调用失败需要重试"和"模型没话说"两种情况。

这个异常携带一个错误码。调用方和前端可以凭码识别。

## 二、类的成员

### （一）字段

- `code`：错误码，固定为`'EMPTY_RESPONSE'`。

### （二）方法

- `__init__`：构造异常。继承自RuntimeError。

## 三、它和谁协作

- 它继承自RuntimeError。
- LLMErrorHandlingMiddleware在重试循环里识别它。空响应的重试预算和瞬态错误不同。
- 上层把错误码透传给调用方。

## 四、重要性评级

评级：4/10。

理由：这个异常是一个信号标记。它的存在让空响应有独立的处理路径。没有它空响应会被当成普通异常。但它的体积小，逻辑少。所以给中等偏低的分数。