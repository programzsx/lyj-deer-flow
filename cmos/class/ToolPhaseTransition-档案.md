# ToolPhaseTransition档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/tool_progress_middleware.py`

## 一、这个类是干什么的

ToolPhaseTransition记录一次持久阶段变化的准确状态机规则。

工具的阶段变化要持久化做审计。
审计记录里要写清楚是哪条规则导致了变化。

这个类就是那条规则记录。
动作是什么。阈值是多少。

有了它。操作员能回答"这个工具为什么被封锁了"。

## 二、类的成员

### （一）字段

- `action`：动作。取值warn、block、recover、reset。
- `threshold`：触发阈值。类别规则、恢复和重置时为None。

### （二）方法

ToolPhaseTransition没有定义自己的方法。
它是纯数据。

## 三、它和谁协作

- ToolProgressMiddleware的`_record_phase_transition`产出它。
- 它进`middleware:tool_progress`审计事件。

## 四、重要性评级

评级：3/10。

理由：ToolPhaseTransition是审计记录的一小部分。两个字段。逻辑全在中间件里。所以分数偏低。