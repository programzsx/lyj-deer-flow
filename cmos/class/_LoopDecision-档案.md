# _LoopDecision档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/loop_detection_middleware.py`

## 一、这个类是干什么的

_LoopDecision是一次循环检测的判定结果。

LoopDetectionMiddleware在检测到重复工具调用时产生一个决策。
决策要么是警告，要么是硬停。

这个类把决策结构化。
结构化的决策可以被持久化做审计。
审计记录里不携带敏感的工具参数。

## 二、类的成员

### （一）字段

- `message`：给模型或审计看的说明文本。
- `action`：动作，取值`'warn'`或`'hard_stop'`。
- `detection_layer`：检测层，取值`'identical_call_set'`或`'tool_frequency'`。
- `tool_names`：涉及的工具名元组。
- `count`：命中的次数。
- `threshold`：触发的阈值。

### （二）方法

- `hard_stop`（property）：便捷判断。返回本次动作是否是硬停。

## 三、它和谁协作

- LoopDetectionMiddleware的`_track_and_check`产出它。
- LoopDetectionMiddleware的`_apply`和`_record_audit_event`消费它。

## 四、重要性评级

评级：5/10。

理由：_LoopDecision是循环检测的结构化输出。审计能力依赖它。它的字段设计让告警可以被追溯。它本身没有行为逻辑。所以给5分。