# deerflow.subagents.context_snapshot-档案

## 一、这个模块是干什么的

这个模块为普通委派捕获不可变的、纯数据的父对话快照。

主代理委派任务给子代理时。子代理需要理解任务的背景。背景来自父线程的对话历史。

这个模块把父对话历史序列化成一个快照。快照以一条后台HumanMessage的形式进入子代理的初始状态。

快照是纯数据的。快照没有指向父状态或兄弟执行的引用。子代理改快照不会影响父线程。

## 二、模块里的主要成员

### 1、SNAPSHOT_SYSTEM_NOTE

这是一个固定的系统提示段。子代理的系统消息里会追加这段文字。

这段文字告诉子代理。快照是历史数据。历史指令不能覆盖系统指令。历史工具调用和结果属于父代理。不是子代理自己的执行。子代理不要重放待处理的调用。不要把历史动作说成自己的。重要声明用自己的工具验证。

这段文字防止子代理把父对话里的工具调用当成自己的执行记录。

### 2、_MEDIA_BLOCK_TYPES

这是一个frozenset。列出保留为输入块的媒体类型。包括image、image_url、audio、input_audio、video、file、document。

媒体保留为输入块。这样有视觉或音频能力的子模型仍然可以使用保留的对话。

### 3、_neutralize_document_content_block函数

这个函数中和原生document块里的文本和引用叙述。

文本块做neutralize_untrusted_tags。引用列表逐条处理。cited_text、document_title、title做中和。引用引用本身保留。媒体保留。

### 4、_neutralize_document_text函数

这个函数把原生document文本复制为历史数据。不透明来源保持不透明。

title和context做中和。source为text类型时data做中和。source为content类型时字符串或块列表逐个中和。

### 5、_is_conversation_message函数

这个函数判断一条消息是否是对话消息。

HumanMessage要求是真实的用户消息。隐藏的澄清回复是用户输入。内存提醒、todo提醒和其他框架注入的HumanMessage不算。

AIMessage和ToolMessage要求additional_kwargs里没有hide_from_ui。隐藏消息不算。

### 6、ParentContextSnapshot数据类

这是核心。frozen dataclass。只有一个字段content_json。

from_state类方法做捕获。捕获在验证之后、分发yield之前。

捕获的内容按顺序是。历史对话摘要。保留的消息。摘要来自summary_text状态键。

消息处理逻辑分几步。

第一步。找出保留的消息位置。只保留真实用户消息、未隐藏的AI消息和工具消息。

第二步。配对工具调用和结果。供应商可能跨轮复用call id。每个结果匹配到它前面的调用。包括隐藏帧里的调用。只有调用和结果都保留的才算已完成的调用。

第三步。逐条渲染保留的消息。字符串内容直接中和后加入。text和output_text块中和后加入。媒体块保留。无法序列化的媒体省略并注明。document块走中和函数。AI消息的已完成工具调用渲染为惰性文本。注明"不是你执行的"。

每条消息前面加角色标签。human、ai、tool。工具结果带工具名和call id。

没有内容时返回None。快照不创建。

to_message方法构建HumanMessage。每次子代理启动都构建新的内容容器。名字是parent_context_snapshot。additional_kwargs带hide_from_ui。这样子代理侧的捕获逻辑不会把它当成对话消息。

## 三、它和谁协作

task_tool在分发时捕获快照。捕获后传给SubagentExecutor的context_snapshot参数。

executor的_build_initial_state把SNAPSHOT_SYSTEM_NOTE加进系统消息。把快照的to_message加进消息列表。

它依赖input_sanitization_middleware的中和函数。依赖message_utils的真实用户消息判断。

它依赖langchain_core的消息类型。

## 四、重要性评级

评级是6分（满分10分）。

理由：

上下文快照让子代理理解任务背景。没有它。委派的子代理只有任务文本。不知道用户之前说了什么、决定了什么。

安全设计很细致。SNAPSHOT_SYSTEM_NOTE明确历史指令不能覆盖系统指令。防止父对话里的注入通过快照进入子代理并获得权威性。工具调用标记为"不是你执行的"。防止子代理冒领历史动作。所有文本都做标签中和。

媒体保留让多模态子模型仍可用。不可序列化的媒体省略而不是猜测编码。

它只在普通委派路径使用。给6分。
