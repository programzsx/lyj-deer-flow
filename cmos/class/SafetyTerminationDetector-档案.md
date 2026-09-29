# SafetyTerminationDetector档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/safety_termination_detectors.py`

## 一、这个类是干什么的

SafetyTerminationDetector是安全终止检测的策略接口。

不同提供方用不同字段、不同取值表达"我因为安全原因停止了这次响应"。
这个Protocol定义了统一的检测形状。

每个实现负责一种提供方的信号。
新提供方想接入。
实现这个接口。
再通过config.yaml的`safety_finish_reason.detectors`接进去。

实现要求是两点的。

一是无副作用。
二是容忍缺失或类型古怪的元数据。
因为检测器跑在每一条模型响应上。

## 二、类的成员

### （一）字段

- `name`：检测器名字。用于观测。

### （二）方法

- `detect`：如果消息表明提供方安全终止，返回SafetyTermination。否则返回None。

## 三、它和谁协作

- OpenAICompatibleContentFilterDetector、AnthropicRefusalDetector、GeminiSafetyDetector实现它。
- SafetyFinishReasonMiddleware消费它。

## 四、重要性评级

评级：3/10。

理由：这是一个策略接口。它本身没有实现。它的价值在于把提供方差异收敛到一个点上。新提供方靠它接入。所以给结构性贡献3分。