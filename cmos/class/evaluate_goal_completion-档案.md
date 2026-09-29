# evaluate_goal_completion-档案

## 一、这个类是干什么的

evaluate_goal_completion不是类。

evaluate_goal_completion是runtime/goal.py里的模块级函数。

它实现Claude Code风格的目标循环评估。

它问一个小型非思考模型活动目标是否已满足。

输入是GoalState和消息列表。

输出是GoalEvaluation。

评估器从runs worker运行。

主图运行已经完成之后。

它只看可见的会话证据。

不假设文件、命令、测试或外部状态变了。

除非会话明确显示变了。

这个模块位于backend/packages/harness/deerflow/runtime/goal.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、evaluate_goal_completion函数

流程如下。

第一步格式化可见会话证据。

没有可见的助手证据时返回missing_evidence。

fail closed。

证据太弱证明不了进展就失败。

第二步构造系统指令。

系统指令要求严格评估。

只用可见会话证据。

第三步注入Langfuse元数据。

这是主图之外的独立模型调用。

必须自己注入Langfuse会话和用户归因。

第四步调用模型。

extensions存在时用observe_system_model_call观察。

第五步解析JSON响应。

### 2、parse_goal_evaluation_response函数

这个函数解析评估器的JSON响应。

先剥think块和markdown围栏。

找到最外层的大括号。

satisfied必须是布尔。

blocker规整。

satisfied为true时blocker是none。

无效blocker回退到missing_evidence。

### 3、should_continue_goal函数

这个函数判断是否要再跑一个隐藏的继续轮。

satisfied时不继续。

blocker不在可继续集合时不继续。

只有goal_not_met_yet可继续。

达到max_continuations不继续。

无进展计数达到上限不继续。

### 4、latest_visible_assistant_signature函数

这个函数返回最新可见助手证据的稳定签名。

无进展判断的键是代理实际产出的东西。

最近用户可见助手消息的文本。

不是评估器的自由文本reason。

LLM每轮改写reason。

它几乎不会逐字节重复。

继续轮没有添加新的可见助手输出时签名不变。

判断器能认出停滞的轮。

### 5、make_goal_continuation_message函数

这个函数构建隐藏的用户消息让代理继续工作。

消息带hide_from_ui标记。

### 6、create_goal_evaluator_model函数

这个函数创建评估器用的非思考模型。

评估器运行时没有图根可继承追踪。

它必须附加自己的模型级tracing回调。

和其他独立的非图调用方一样。

### 7、goal读写

- read_thread_goal和write_thread_goal读写字符目标。
- 写目标持有goal_thread_lock串行。
- GoalWriteConflict在基于过期checkpoint的写入时抛出。

## 三、它和谁协作

- GoalState和GoalEvaluation是目标和评估数据结构。
- runs worker在主图完成后调用评估。
- create_chat_model创建评估模型。
- inject_langfuse_metadata注入追踪。
- goal_thread_lock串行目标写入。

## 四、重要性评级

评级是8分。

理由如下。

这个函数是目标循环的大脑。

它决定任务是否完成、是否继续。

fail closed的证据语义防止提前宣称完成。

无进展判断键在实际产出上。

不是LLM改写的自由文本。

这防止无限循环。

blocker词汇区分六种情况。

只有goal_not_met_yet可继续。

目标读写有锁串行。

这些是自动继续正确性的关键。

扣掉2分。

扣分原因是评估本身靠LLM。
