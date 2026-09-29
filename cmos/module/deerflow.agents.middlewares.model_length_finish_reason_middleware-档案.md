# deerflow.agents.middlewares.model_length_finish_reason_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/model_length_finish_reason_middleware.py。

## 一、这个中间件是干什么的

这个中间件负责处理provider的输出长度截断。

背景是issue bytedance/deer-flow#4271。

有些provider在输出预算耗尽时停止生成。

provider通过finish_reason='length'表达这个情况。

但provider同时还会返回部分助手内容。

这时有一个隐患。

被输出边界截断的工具调用可能不完整。

不完整的工具调用如果继续执行会出问题。

这个中间件做三件事。

第一件事是保留可见内容。

截断的文本对用户仍然可见。

第二件事是在工具调用被压制时追加一条确定性提示。

即使部分文本存活，提示也要追加。

第三件事是在工具调用可能被截断时丢弃它们。

丢弃发生在工具调用执行之前。

中间件还会打上model_length_termination标记。

这个标记告诉下游防护让路。

下游防护主要是TodoMiddleware。

标记让下游不要再介入一个已经封顶的回合。

## 二、模块里的主要成员

### 1、ModelLengthFinishReasonMiddleware类

这是模块的核心类。

构造参数是detectors检测器列表。

不传时用default_detectors()内置检测器集。

### 2、after_model和aafter_model钩子

这两个钩子调用_apply方法。

_apply的逻辑分几步。

第一步，取state里最后一条消息。

不是AIMessage就返回None。

第二步，用检测器判断是否长度截断。

检测器逐个尝试。

检测器抛异常时当作未命中处理。

provider检测器不能破坏运行。

第三步，写运行上下文。

runtime.context里写stop_reason。

上下文里已有stop_reason时不覆盖。

这一点保留了隐藏延续轮次携带的更早封顶原因。

然后记日志。

第四步，判断内容形态。

has_tool_call_intent或原生Anthropic tool_use块存在时认为有工具调用意图。

有工具调用意图时先清掉内容里的原生tool_use块。

然后判断是否有可见内容。

没有工具调用意图且有可见内容时直接返回None。

纯文本截断不需要处理。

第五步，构造替换消息。

有工具调用意图时，从additional_kwargs里弹出tool_calls和function_call。

工具参数在max-token边界可能不完整。

additional_kwargs里写入model_length_termination标记。

标记包含检测器名、原因字段、原因值、被压制的工具调用数和名称。

最后用model_copy构造替换消息。

替换消息的tool_calls和invalid_tool_calls都是空列表。

可见文本后面追加_MODEL_LENGTH_CAPPED_CONTENT提示。

提示内容是"模型达到输出上限，请继续对话恢复"。

### 3、_tool_call_summary函数

这个函数统计被压制的工具调用。

返回数量和去重后的名称。

来源覆盖三个层次。

第一层是结构化的tool_calls和invalid_tool_calls。

第二层是additional_kwargs里的原始tool_calls和function_call。

第三层是内容块里的Anthropic原生tool_use块。

### 4、_anthropic_tool_use_blocks和_without_anthropic_tool_use_blocks函数

_anthropic_tool_use_blocks从消息内容里提取Anthropic原生tool_use块。

内容不是列表时返回空。

_without_anthropic_tool_use_blocks从内容里移除原生工具调用。

这些调用收不到配对的结果，必须移除。

### 5、release_policy_parameters方法

这个方法声明中间件的行为参数。

包含suppress_truncated_tool_calls开关和提示文本的canonical_hash。

这是中间件自我描述机制的一部分。

声明值用于装配身份，不用提示文本副本。

## 三、它和谁协作

这个中间件在中间件链里是lead专属的中间件。

它在lead_agent的build_middlewares里装配。

位置在尾部，属于终结处理段。

依赖model_length_termination_detectors的检测器和default_detectors。

检测器负责识别各provider的截断信号。

依赖model_response的append_visible_text、has_tool_call_intent和has_visible_content。

它打的model_length_termination标记被下游消费。

TodoMiddleware看到标记就跳过提醒。

这样被截断的回合干净结束。

ModelLengthFinishReasonMiddleware与SafetyFinishReasonMiddleware对称。

两者都处理provider的非正常终止。

## 重要性评级

评级是7分。

理由如下。

输出长度截断是生产环境的常见情况。

长任务、大文件写入都可能触发。

截断的工具调用如果继续执行，参数可能残缺。

残缺参数会导致工具报错甚至写坏文件。

这个中间件把截断回合安全落地。

它保留内容、丢弃危险调用、通知下游。

多provider检测器的设计让覆盖面完整。

所以评级是7分。

不评更高分的理由是它只在截断发生时生效。

多数回合正常结束，不经过这条路径。

也不评低分，因为截断处理错误会直接影响任务正确性。
