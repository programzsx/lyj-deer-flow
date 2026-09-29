# GoalEvaluation档案

## 一、这个类是干什么的

GoalEvaluation是一次目标评估的结果记录。

DeerFlow支持给线程设置目标。
智能体在持续运行中会周期性评估目标完成情况。
每次评估产生一个结论。
目标达没达成。
没达成的原因是什么。
GoalEvaluation就是这条评估结论的数据形状。

这个类解决的问题很明确。

目标评估需要一个结构化的结论。
不能只返回一个布尔值。
智能体和目标管理逻辑需要知道评估细节。
比如阻塞原因。
比如证据摘要。
GoalEvaluation把这些细节结构化。

这个类在goal_state.py文件里。
文件还定义了GoalBlocker类型。
GoalBlocker是一个Literal类型。
列出了六种阻塞原因。
GoalEvaluation的blocker字段的取值范围就是这六种。

这个类在什么场景被使用。

- 目标评估逻辑评估目标后写入这个结构。
- GoalState的last_evaluation字段保存最近一次评估。
- 评估逻辑根据satisfied和blocker决定下一步。
比如继续运行、请求用户输入、结束运行。

## 二、类的成员（字段、方法，各自做什么）

### （一）字段

- satisfied：目标是否达成。类型是bool。
这是评估的核心结论。
True表示目标已达成。
False表示未达成。

- blocker：阻塞原因。类型是GoalBlocker。
satisfied为False时说明为什么没达成。
取值范围是六种Literal值。

- reason：评估理由。类型是str。
人类可读的文字说明。
解释评估结论是怎么得来的。

- evidence_summary：证据摘要。类型是NotRequired[str]。
可选字段。
评估依据的证据的简短摘要。

### （二）GoalBlocker的六种取值

GoalBlocker定义在同一个文件里。
是GoalEvaluation的blocker字段的取值来源。

- none：没有阻塞。
- missing_evidence：缺少证据。
- needs_user_input：需要用户输入。
- run_failed：运行失败。
- external_wait：等待外部事件。
- goal_not_met_yet：目标尚未达成。

### （三）方法

这个类没有任何方法。
它是纯数据结构。
TypedDict只定义字段形状。
评估的执行逻辑在目标评估相关模块里。

## 三、它和谁协作

### （一）GoalState

- GoalState是同文件里的目标状态类。
GoalState的last_evaluation字段保存评估结果。
字段类型是NotRequired[dict[str, Any]]。
GoalEvaluation的字典形态会存进这个字段。
两者是目标体系的核心搭配。
GoalState记录目标本身和计数器。
GoalEvaluation记录单次评估的结论。

### （二）GoalBlocker

- blocker字段的类型来自GoalBlocker。
GoalBlocker是同文件的Literal类型定义。

### （三）使用方

- 目标评估逻辑。评估目标后产出这个结构。
- 目标管理链路。根据评估结论决定继续或结束。
- ThreadState的goal字段。保存包含评估的完整目标状态。

### （四）数据流向

- 产出方向。评估逻辑评估目标后产出结论。
- 保存方向。结论写进GoalState的last_evaluation。
- 消费方向。目标管理逻辑读取satisfied和blocker做决策。

## 四、重要性评级（1-10分+理由）

评级是4分。

理由如下。

GoalEvaluation是目标评估结论的结构化载体。
目标持续运行机制依赖这个结论来决定下一步。
satisfied决定是否结束。
blocker决定阻塞类型。
比如needs_user_input意味着要暂停等用户。

但是要看到范围。
这个类是四字段的纯数据结构。
评估的实际逻辑不在这里。
它的价值依附于目标持续运行机制。
目标功能是可选特性。
不是每个线程都设置了目标。

如果删掉这个类。
评估结论就退化为松散字典。
blocker的类型约束消失。
六种阻塞原因的枚举约束也消失。
目标管理逻辑的可靠性下降。
但系统核心对话和工具能力不受影响。

依赖它的地方包括GoalState、GoalBlocker、目标评估逻辑。
范围集中且较小。

综合来看。
这是目标功能里的辅助结构。
有用但体量小。
评级给4分。
