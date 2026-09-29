# deerflow.agents.middlewares.terminal_response_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/terminal_response_middleware.py。

## 一、这个中间件是干什么的

这个中间件防止空的工具后终态响应变成静默成功。

场景是这样的。

模型执行完工具之后要给出最终回答。

有时模型返回一条空的AIMessage。

消息里没有可见内容，也没有工具调用意图。

没有处理的话，这次运行会"正常结束"。

用户看到的什么都没有。

这是一个静默失败。

这个中间件在检查点状态里把空响应替换成一条可见的错误回退消息。

这样运行以错误收尾。

错误是可见的。

不是静默成功。

这个中间件是模型边界空响应恢复之后的最后一道兜底。

## 二、模块里的主要成员

### 1、常量

_FALLBACK_CONTENT是回退消息文本。

内容是"The model completed the tool run but returned no final response. Please try again or use a different model."。

这条消息告诉用户重试或换模型。

### 2、_tool_result_in_current_turn

这个函数判断最新真实用户消息之后有没有工具结果。

这个函数扫描消息列表。

先找最新的真实用户消息。

hide_from_ui为true的HumanMessage不算真实用户消息。

Human Input Card的回复带hide_from_ui。

这样的消息被跳过。

没有真实用户消息就返回false。

然后检查最新用户消息之后有没有ToolMessage。

有就返回true。

这个检查保证回退只发生在工具后终态。

没有工具结果的空响应不归这个中间件管。

### 3、TerminalResponseMiddleware类

这个类继承AgentMiddleware。

release_policy_parameters返回策略自我描述。

post_tool_empty_retry_limit是0。

fallback_content_hash是回退文本的canonical_hash。

用哈希而不是文本副本。

这符合中间件自我描述的规范。

### 4、_apply

这个方法是核心逻辑。

流程如下。

第一步取最后的消息。

消息为空或最后一条不是AIMessage就返回None。

第二步检查空响应条件。

用model_response模块的两个函数。

has_visible_content检查有没有可见内容。

has_tool_call_intent检查有没有工具调用意图。

两者都为false才是空响应。

任何一个为true就返回None。

第三步检查是否在当前轮有工具结果。

调用_tool_result_in_current_turn。

false就返回None。

第四步构建回退消息。

additional_kwargs里盖两个标记。

deerflow_error_fallback为true。

error_reason是"Model returned an empty terminal response"。

用model_copy原地替换。

内容用append_visible_text追加回退文本。

保留原消息的其他字段。

第五步返回状态更新。

更新包含替换后的消息。

相同的消息id触发检查点里的替换。

### 5、after_model和aafter_model

两个钩子都调用_apply。

after_model在模型响应之后运行。

aafter_model是异步版本。

deerflow_error_fallback标记会被run worker消费。

worker据此把运行结束为error状态。

## 三、它和谁协作

在中间件链里这个中间件位于尾部。

装配顺序是共享运行时基础段、lead专属段、自定义中间件、配置声明的扩展，然后是终端响应/安全/澄清尾部。

这个中间件属于终端响应/安全/澄清尾部。

它在扩展之后。

这样LangChain按逆序分发after_model钩子时，位于安全中间件之后意味着安全中间件的after_model先运行。

上游是模型边界。

模型返回空终态响应。

上游还包括model_response模块。

has_visible_content和has_tool_call_intent来自deerflow.agents.middlewares.model_response。

append_visible_text也来自那里。

这个中间件是"最后一道兜底"。

模型边界的空响应恢复先运行。

文档声明这是last-resort fallback。

下游是run worker。

worker读取deerflow_error_fallback标记。

worker把运行结束为error。

用户看到可见的错误消息。

不消费这个标记的话，运行会以成功结束。

用户看到空回复。

## 重要性评级

评级是6分。

理由如下。

静默失败是最差的一类用户体验问题。

模型返回空响应不是罕见场景。

工具执行后模型有时确实会返回空。

没有这个中间件，用户会看到运行成功结束但没有任何内容。

用户会以为系统坏了。

这个中间件把静默失败变成可见错误。

这样用户可以重试或换模型。

运维也能从运行状态里看到错误。

所以评级是6分。

不评更高分的原因有三个。

第一，这个中间件只有74行，作用面很窄。

第二，它只处理一种失败形态，就是工具后的空终态响应。

第三，它不做恢复，只做标记。

真正的重试在模型边界的空响应恢复层。
