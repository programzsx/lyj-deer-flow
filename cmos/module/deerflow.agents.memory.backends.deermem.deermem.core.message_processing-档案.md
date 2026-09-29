# message_processing.py 档案

模块全名是deerflow.agents.memory.backends.deermem.deermem.core.message_processing。

源文件位置是backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/message_processing.py。

## 一、这个模块是干什么的

这个模块是一组共享的辅助函数。

这些函数把对话消息变成记忆更新的输入。

它回答四个问题。

问题一是哪些消息值得存进记忆。filter_messages_for_memory负责筛选。

问题二是这段对话有没有用户信号。detect_correction、detect_reinforcement、detect_signals负责检测信号。

问题三是这段对话是不是全是客套话。filter_trivial负责过滤琐碎消息。

问题四是信号的正则从哪里来。load_patterns负责加载和编译信号模式。

这个模块是确定性的。

确定性意味着同样的输入永远产生同样的输出。

不调用任何模型。

不访问网络。

## 二、模块里的主要成员

（一）load_patterns函数

load_patterns函数从YAML文件加载并编译信号模式。

参数name是信号名，比如correction或reinforcement。

参数patterns_dir可以覆盖内置的core/message_patterns目录。

不传时加载内置默认。

内置默认镜像了外部化之前的硬编码模式。

所以零配置行为不变。

编译结果按(name, patterns_dir)缓存。

YAML列表的每一项有两种形式。

- 字符串形式。用无标志编译。
- 映射形式。形如{pattern: 正则, flags: [...]}。flags可以含ignorecase。

错误处理分两种策略。

显式指定patterns_dir时，文件缺失抛FileNotFoundError。读不了重新抛。

用内置默认时，文件缺失或读不了只记WARNING并返回空列表。

区别的理由是前者是配置错误，后者是打包bug。

无效的YAML、顶层不是列表、无效的正则都抛ValueError。

消息里带文件路径。

（二）extract_message_text函数

extract_message_text函数从消息content里提取纯文本。

content可能是字符串。

content也可能是多模态的列表。

列表里的字符串直接收集。

列表里的字典取text字段收集。

最后用空格拼接。

（三）filter_messages_for_memory函数

filter_messages_for_memory函数只保留用户输入和最终助手回复。

函数的筛选规则如下。

human消息默认保留。

但带hide_from_ui标记的human消息要特殊处理。

hide_from_ui标记的是中间件注入的隐藏消息。

这些消息包括TodoMiddleware的提醒、ViewImage的载荷、DynamicContextMiddleware的__memory条目。

这些消息绝不能到达记忆更新的LLM。

否则框架内部文本会污染长期记忆。

__memory载荷甚至可能触发自我放大循环。

但有一种隐藏消息例外。

这种例外是用户亲手写的澄清回答。

澄清回答带well-formed的human_input_response载荷。

_is_human_clarification_response函数用结构检查识别它。

结构检查要求版本是1、kind是human_input_response、source/request_id/value非空。

选项类回答还要有非空的option_id。

这个检查是宿主read_human_input_response的结构镜像。

宿主在生产里通过should_keep_hidden_message钩子注入权威版本。

两个实现必须保持同步。

ai消息只有不带tool_calls的才保留。

带tool_calls的中间回复不进记忆。

另外还有一个上传块的处理。

human消息里如果含current_uploads标签，标签块会被剥掉。

剥掉之后什么都不剩时，下一条不带tool_calls的ai消息也会被跳过。

这是因为那条ai只是对上传文件的确认。

（四）detect_correction和detect_reinforcement函数

这两个函数检测最近的用户消息里有没有修正信号或正强化信号。

扫描窗口固定是messages[-6:]。

也就是最近6条消息里的human消息。

匹配方式是正则搜索。

任一模式命中就返回True。

这两个函数保留是为了向后兼容。

新代码应该用detect_signals。

（五）detect_signals函数

detect_signals函数是上面两个函数的泛化。

它检测全部六种信号类。

- correction，修正。
- reinforcement，正强化。
- preference，偏好。
- identity，身份。
- goal，目标。
- decision，决定。

信号名和事实的category枚举对齐。

reinforcement例外。它没有同名的category，在提取提示里映射到preference或behavior。

默认窗口是最后6条消息。

window参数传None时扫描全部消息。

全量扫描是给预筛选的L3否决用的。

理由是这样的。

跳过会消费整个post-watermark批次。

所以批次里任何位置出现明确信号都必须让它免于跳过。

不只是末尾窗口里出现才行。

（六）filter_trivial函数

filter_trivial函数丢掉纯客套话的用户轮次和对应的AI回复。

什么算纯客套话。

整条消息（去空白、去尾部标点）完整匹配trivial模式才算。

模式例子有嗯、ok、好的、谢谢。

匹配用fullmatch。

所以包含ok的实质消息永远不会被丢。

被匹配的用户轮次和紧随其后的助手回复都被移除。

移除复用了skip_next_ai纪律。

所有轮次都琐碎时结果是空列表。

调用方把空列表当作"不要入队"。

这样省掉一次提取LLM调用。

## 三、它和谁协作

（一）它依赖谁

它依赖yaml、re、logging。

它读取core/message_patterns/子目录下的YAML模式文件。

message_patterns子目录本身不用写档案，但它是这个模块的数据来源。

（二）谁调用它

updater.py是主要调用方。

updater用detect_signals在入队时和更新时检测信号。

updater用extract_message_text间接通过_message_identity和信号检测使用它。

queue.py的ConversationContext携带signals字段。

signals字段的值就来自这个模块的detect_signals。

宿主的MemoryMiddleware在入队前用它做预筛。

## 四、设计意图

这个模块的核心设计是确定性。

信号检测决定了很多下游行为。

信号决定背压下能不能入队。

信号决定提取提示写什么。

信号决定确认门能不能通过。

信号决定预筛选能不能跳过批次。

这些决策都不能依赖模型的随机输出。

所以信号检测全部用正则。

正则外部化到YAML文件。

外部化的好处是不改代码就能调整模式。

每个信号名的模式放在message_patterns/{name}.yaml。

## 重要性评级

评级是7分（满分10分）。

理由如下。

这个模块是记忆写入管线的第一道工序。

没有筛选，框架消息会污染长期记忆。

污染里最危险的是__memory自我放大循环。

hide_from_ui的排除逻辑防住了这个循环。

没有信号检测，提取提示没有方向，确认门没有依据。

没有琐碎过滤，每次"好的""谢谢"都会浪费一次提取LLM调用。

它还是少量确定性证据的来源。

确认门只认确定性信号集。

模型输出永远不能替代它。

它的局限是只覆盖英文和中文的部分模式。

模式是启发式的，会有漏检和误检。

但它只是提示和门禁，不是唯一防线。

综合来看，它是记忆系统的关键输入层。

评7分。
