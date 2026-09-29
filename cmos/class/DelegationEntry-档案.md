# DelegationEntry档案

## 一、这个类是干什么的

DelegationEntry是子任务委派台账里的单条记录。

DeerFlow支持任务委派。
主智能体把子任务委派给子智能体执行。
每一次委派都要记账。
DelegationEntry就是台账里的一条账目。

这个类解决的问题很具体。

第一。
委派记录需要跨检查点保存。
上下文压缩后对话消息可能被裁掉。
但委派台账保存在状态里。
台账能存活下来。

第二。
同一线程会在多次运行里重复使用。
Provider的消息id在不同运行里可能重复。
所以台账用（run_id、消息id）二元组做记录身份。
这是run作用域的身份设计。

第三。
委派执行可能被护栏提前终结。
比如token护栏、轮次护栏、循环护栏。
状态本身保持completed或failed。
stop_reason字段是附加信号。
用来区分被护栏终结的运行和干净完成的运行。
模块注释引用了#3875 Phase 2说明这个设计的来历。

第四。
父方校验结果要随记录保存。
receipt_verdict是引用校验的判定。
acceptance_verdict是验收清单的判定。
两者都来自RFC #4651。
历史遗留记录上没有这两个字段。
所以都是可选的。

这个类在什么场景被使用。
ThreadState的delegations字段使用这个类型。
委派工具写入记录。
子任务完成回写时更新记录。
检查点保存时随线程持久化。

## 二、类的成员（字段、方法，各自做什么）

### （一）字段

- id：记录标识。类型是str。通常是发起委派的工具调用id。
- run_id：所属运行的id。类型是NotRequired[str]。历史记录可能没有这个字段。没有run_id的更新仍然按旧规则更新最近一条匹配记录。
- description：委派任务的描述。类型是str。说明子任务要做什么。
- subagent_type：子智能体类型。类型是str。比如general-purpose这类类型名。
- status：委派的当前状态。类型是str。状态值来自子任务状态契约。
- result_brief：结果摘要。类型是NotRequired[str]。子任务完成后写入的简短结果说明。
- result_sha256：结果内容的SHA-256哈希。类型是NotRequired[str]。用于校验结果引用。
- result_ref：结果引用。类型是NotRequired[str]。指向完整结果的存放位置。
- stop_reason：提前终结原因。类型是NotRequired[str]。取值是token_capped、turn_capped、loop_capped。状态保持completed或failed。这个字段是区分护栏终结的附加信号。
- receipt_verdict：父方引用校验判定。类型是NotRequired[dict]。RFC #4651 PR2引入。任务回写时盖章。属于建议性执行证据。
- acceptance_verdict：验收清单判定。类型是NotRequired[dict]。RFC #4651 PR4引入。来源和receipt_verdict相同。是确定性的验收判定。
- created_at：记录创建时间。类型是str。

### （二）方法

这个类没有任何方法。
它是纯数据结构。

### （三）配套的reducer

delegations字段绑定merge_delegations这个reducer。

合并规则如下。

- 新值是None或空就保留已有值。
- 追加新条目。相同的（run_id、消息id）用最新版本替换。同时保留首次出现的顺序。
- 没有run_id的遗留更新仍然更新最近一条匹配id的记录。
- 终态状态永远不会被非终态状态覆盖。
- 台账上限是50条。超出就裁掉最旧的。

## 三、它和谁协作

### （一）被组合

- ThreadState的delegations字段使用这个类。
字段定义是Annotated[list[DelegationEntry]， merge_delegations]。

### （二）协作的模块

- deerflow.subagents.status_contract。提供TERMINAL_STATUSES的来源SUBAGENT_STATUS_VALUES。
- merge_delegations函数。负责台账合并。
- 子任务委派系统。executor.py执行子任务。registry.py管理注册。
- 委派工具。写入委派记录。
- 检查点持久化层。保存台账。

### （三）数据流向

- 写入方向。委派发生时写入新记录。
- 更新方向。子任务回写时更新status、result_brief、verdict等字段。
- 读取方向。智能体和护栏逻辑读取台账了解委派历史。

## 四、重要性评级（1-10分+理由）

评级是6分。

理由如下。

DelegationEntry承载的是子任务委派的完整历史。
委派是DeerFlow的核心特性之一。
没有台账。
上下文压缩后委派历史全部丢失。
智能体无法知道之前委派过什么、结果是什么。

这个类的字段设计携带了多层保证。
run作用域身份解决了id跨运行重复的问题。
终态保护避免了状态回退。
stop_reason区分了护栏终结和干净完成。
receipt_verdict和acceptance_verdict保存了父方校验证据。

但是要看到边界。
这个类是纯数据结构。
全部逻辑在reducer和委派系统里。
它的价值依赖整个委派链路。

如果删掉这个类。
delegations字段失去类型。
委派历史无法持久化。
护栏回写和验收判定全部失去载体。
委派功能的状态层面会明显退化。

依赖它的地方包括ThreadState、merge_delegations、委派工具、子任务回写逻辑。
范围中等偏上。

综合来看。
这是核心特性里的关键数据结构。
评级给6分。
