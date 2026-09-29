# ModelLengthTerminationDetector档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/model_length_termination_detectors.py`

## 一、这个类是干什么的

ModelLengthTerminationDetector是长度截断检测的策略接口。

不同提供方用不同字段、不同取值报告输出超长。
这个Protocol定义了统一的检测形状。

每个实现负责一种提供方的信号拼法。
ModelLengthFinishReasonMiddleware只认这个接口。
中间件专注在何时标记运行。
提供方的字段细节留给检测器。

新的提供方想接入。
实现这个接口。
再通过config.yaml的检测器配置接进去。

## 二、类的成员

### （一）字段

- `name`：检测器名字。用于观测，让操作员知道是哪条规则命中的。

### （二）方法

- `detect`：接收一条AIMessage。如果消息表明输出被长度截断，返回ModelLengthTermination。否则返回None。

## 三、它和谁协作

- OpenAICompatibleLengthDetector、AnthropicMaxTokensDetector、GeminiMaxTokensDetector实现它。
- ModelLengthFinishReasonMiddleware消费它。

## 四、重要性评级

评级：3/10。

理由：这是一个策略接口。它本身没有实现。它的价值在于把提供方差异收敛到一个点上。没有它中间件会塞满各家提供方的字段判断。所以给结构性贡献3分。