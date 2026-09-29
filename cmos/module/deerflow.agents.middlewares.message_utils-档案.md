# deerflow.agents.middlewares.message_utils档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/message_utils.py。

## 一、这个模块是干什么的

这个模块是中间件共享的消息列表辅助函数集合。

它不是一个中间件类，是一个工具函数模块。

它回答两个关键问题。

第一个问题是"这条消息是不是真实用户发的"。

第二个问题是"这条消息的内容需不需要输入脱敏"。

这两个问题看起来一样，其实不一样。

模块的存在就是为了把它们分开。

判断错了会导致两个方向的问题。

把框架注入的消息当成真实用户消息，会导致注入内容逃过脱敏。

把真实用户消息当成框架注入，会导致用户的请求被错误处理。

模块还提供第三个函数，解决注入消息的位置问题。

## 二、模块里的主要成员

### 1、is_genuine_user_message函数

这个函数判断真实用户消息。

判断条件分几步。

第一步，消息必须是HumanMessage。

其他类型直接返回False。

第二步，name为summary的消息不算。

那是总结注入的隐藏消息。

第三步，hide_from_ui为真的隐藏消息要看情况。

hide_from_ui也被HumanInputCard的隐藏UI回复使用。

所以只有隐藏且没有有效用户响应的消息才算非用户消息。

判断用read_human_input_response读取响应。

读不到有效响应才算非用户消息。

这个函数被多个地方使用。

turn边界检测用它。

ToolReceiptMiddleware用它。

McpRoutingMiddleware用它找最新用户消息。

### 2、requires_input_sanitization函数

这个函数判断消息内容是否需要输入防护处理。

这个函数故意不是is_genuine_user_message的别名。

is_genuine_user_message还驱动turn边界检测，必须把框架注入的消息报成非用户消息。

脱敏需要知道的问题更窄：这段内容是否来自信任边界之外。

调用方提供的消息一定来自边界之外，不管它带什么框架标记。

hide_from_ui也是三个前端发送者把上下文消息挡在对话记录外的方式。

这个展示选择不能换来一份未脱敏的载荷。

网关用UNTRUSTED_INPUT_KEY标记这些消息。

判断逻辑是三段。

第一段，不是HumanMessage返回False。

第二段，additional_kwargs里有UNTRUSTED_INPUT_KEY标记就返回True。

第三段，其余情况回退到is_genuine_user_message判断。

这样框架注入的信任块保持不转义。

### 3、insert_after_leading_system_messages函数

这个函数把消息插入到前导SystemMessage之后。

上下文注入的位置有讲究。

正确位置是系统提示之后、对话历史之前。

注入的语义是"先指令，后背景上下文"。

错误位置有两个。

放在系统消息之前违反provider和协议假设。

放在消息列表尾部会挤掉最新一轮，还会被读成工具输出。

函数扫描消息列表开头连续的SystemMessage。

扫描计数下标。

然后在前导系统段之后插入新消息。

## 三、它和谁协作

这个模块是纯函数模块，被多个中间件引用。

McpRoutingMiddleware用is_genuine_user_message找最新用户消息。

输入脱敏防护和ToolResultSanitizationMiddleware的判定逻辑与requires_input_sanitization对应。

依赖deerflow.agents.human_input的read_human_input_response读取HumanInputCard回复。

依赖deerflow.utils.messages的UNTRUSTED_INPUT_KEY识别网关标记。

它服务的中间件都在中间件链的不同层。

位置插入函数被上下文注入类中间件使用。

## 重要性评级

评级是6分。

理由如下。

这个模块小，只有3个函数。

但这3个函数是信任判定的共享词汇。

真实用户消息的判定分散在多个中间件里。

判定不一致会直接造成注入逃逸或误处理。

requires_input_sanitization和is_genuine_user_message故意分开，这一点承载了明确的信任边界决策。

hide_from_ui的双重语义是这里的关键知识。

所以评级是6分。

不评更高分的理由是它没有独立行为。

它只在被引用时才有意义。

也不评低分，因为信任判定出错的影响是安全级的。
