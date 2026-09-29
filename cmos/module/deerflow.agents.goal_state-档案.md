# deerflow.agents.goal_state-档案

## 一、这个模块是干什么的

这个文件定义线程目标的状态结构。

线程目标描述一次对话要完成的长期目标。

这个文件只有类型定义。

这个文件没有任何逻辑。

目标状态跟checkpoint一起持久化。

## 二、模块里的主要成员

### 1、GoalBlocker类型

GoalBlocker是阻塞原因的字面量类型。

取值有这些。

none表示没有阻塞。

missing_evidence表示缺少证据。

needs_user_input表示需要用户输入。

run_failed表示运行失败。

external_wait表示等待外部。

goal_not_met_yet表示目标尚未达成。

### 2、GoalEvaluation类型

GoalEvaluation是对目标的一次评估。

字段有satisfied、blocker、reason。

satisfied表示目标是否满足。

blocker是阻塞原因。

reason是原因说明。

evidence_summary是可选的证据摘要。

### 3、GoalState类型

GoalState是目标状态本体。

字段有这些。

objective是目标描述。

status固定是active。

created_at和updated_at是时间戳。

continuation_count是已延续次数。

max_continuations是最大延续次数。

no_progress_count是无进展次数。

max_no_progress_continuations是无进展上限。

last_evaluation是最近一次评估。

## 三、它和谁协作

它依赖typing的TypedDict。

它被deerflow.agents.thread_state引用。

thread_state的goal字段用GoalState做类型。

它被deerflow.runtime.goal引用。

runtime.goal负责目标的读写和构建。

client的get_goal、set_goal、clear_goal走runtime.goal。

## 四、重要性评级

评级是4分。

理由是这个文件定义了目标持续运行机制的数据形状。

目标的延续次数和无进展计数控制自动延续的上限。

评估结构让目标能否达成有明确的表达。

不评高分的原因是它只有类型。

没有任何行为，没有它系统也可以用普通字典运转。

类型定义的价值在于契约清晰。
