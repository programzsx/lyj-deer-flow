# deerflow.runtime.goal 档案

## 一、这个模块是干什么的

这个模块实现"Claude Code风格的目标循环"。

场景是这样的。

用户给一条线程设一个目标。例如"把这个bug修好"。

主agent跑完一轮之后。系统不能确定目标是否达成。

这个模块让一个小的、不开思考的模型当"评估员"。

评估员看可见的对话证据。判断目标是否满足。

不满足且能继续时。系统构造一条隐藏的用户消息。让agent继续干。

这个模块提供目标状态的读写。评估的执行。继续与否的判定。

它故意放在deerflow包里。这样harness层可以评估和继续运行。不用导入FastAPI应用。

## 二、模块里的主要成员

- `GoalCommand`和`parse_goal_command(args)`。解析`/goal`斜杠命令。空参数是查状态。`clear`/`reset`/`off`是清除。其他是设置目标。TUI和IM渠道共享这一份语义。

- `normalize_goal_objective(objective)`。规范化目标文本。压空白。限4000字符。

- `build_goal_state()`。创建新的活跃目标状态。连续次数上限默认8。无进展连续次数上限默认2。

- `parse_goal_evaluation_response(text)`。解析评估员的JSON响应。容忍markdown围栏和think块。必须有布尔`satisfied`字段。blocker归一化到合法枚举。satisfied为true时blocker强制为`none`。

- `evaluate_goal_completion(goal, messages, ...)`。核心函数。构造评估提示。调小模型。返回GoalEvaluation。证据不足时直接返回`missing_evidence`。不调模型。这是fail closed。

- `should_continue_goal(goal, evaluation)`。判断是否继续。不满足、blocker可继续、没到连续上限、没到无进展上限。四个条件都过才继续。

- `latest_visible_assistant_signature(messages)`。取最近可见AI回复文本的sha256。"无进展"检测靠这个签名。不靠评估员的自由文本。因为LLM每次都会换措辞。不会逐字节重复。

- `compute_goal_progress_key`和`compute_no_progress_count`。用blocker加证据签名做稳定键。键不变就累加无进展计数。

- `make_goal_continuation_message(goal, evaluation)`。构造隐藏的继续消息。带`hide_from_ui`标记。

- `read_thread_goal`和`write_thread_goal`。从checkpoint读目标。写新checkpoint设或清目标。写入时把新checkpoint挂到派生它的那个checkpoint上。不挂父级会切断delta重放的祖先链。

- `attach_goal_evaluation()`。把评估结果附加到目标副本上。

- `ensure_thread_checkpoint(checkpointer, thread_id)`。线程没有checkpoint时创建一个空的。

- `goal_thread_lock(thread_id)`。用keyed_lock表串行化目标的读改写序列。

## 三、它和谁协作

它依赖`agents/goal_state.py`的类型。依赖`models.create_chat_model`建评估模型。

它依赖`keyed_lock.py`做线程锁。依赖`utils/llm_text.py`清洗响应。依赖`utils/messages.py`提取文本。依赖`utils/time.py`拿时间戳。

它依赖`tracing`注入Langfuse元数据。评估是独立模型调用。不在主图里。必须自带追踪归因。

它依赖extension-api的SystemOperationKind。有扩展时通过`observe_system_model_call`通知扩展。

它的调用方是`runtime/runs/worker.py`。主图跑完后worker调它评估和继续。

## 四、重要性评级

评级是7分。

理由如下。

目标循环是产品级的自治能力。评估错一次。agent要么白干一轮。要么提前停下。

无进展检测的设计很讲究。靠证据签名。不靠评估员措辞。这个设计避免了LLM自由文本导致的检测失效。

checkpoint写入的父级挂接处理了delta重放祖先链的完整性。

它同时服务Gateway、TUI、IM三个表面。斜杠命令语义集中一处。

扣3分是因为它是可选功能。没设目标的线程完全不经过它。
