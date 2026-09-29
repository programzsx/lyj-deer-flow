# deerflow.utils.messages 档案

## 一、这个模块是干什么的

这个模块做"消息的文本提取和身份判定"。

LangChain的消息对象内容形状很多。纯字符串。字符串列表。字典列表。嵌套内容。

很多组件需要从消息里提取可显示的文本。

很多组件需要判断一条消息是不是真的用户消息。

这个模块把这些集中起来。

它还处理两个特殊问题。

一个是"原始用户文本"。输入中间件会把模型看到的文本替换掉。原始文本保存在additional_kwargs里。历史记录要持久化原始文本。

一个是"注入消息的id后缀"。动态上下文中间件会换消息id。重放时要还原。

## 二、模块里的主要成员

- `ORIGINAL_USER_CONTENT_KEY`。常量。值为`original_user_content`。中间件保存原始用户文本的键。

- `SUMMARY_MESSAGE_NAME`。常量。值为`summary`。总结消息的名字标记。

- `UNTRUSTED_INPUT_KEY`。常量。值为`untrusted_input`。网关盖在不可信调用者消息上的标记。标记让输入护栏知道内容来自信任边界之外。剥掉标记会让三个合法的前端发送者意外变成可跳过。

- `INJECTED_USER_MESSAGE_ID_SUFFIX`。常量。值为`__user`。中间件的id换位给真实用户消息加的后缀。

- `strip_injected_user_message_id_suffix(message_id)`。还原id换位前的id。重放持久化的用户轮次要喂图客户端原始发的id。带后缀的消息会被跳过注入。重放它会静默丢掉那轮的日期和记忆块。

- `message_content_to_text(content)`。从原始content提取文本。None返回空串。`str(None)`是真值的字面`"None"`。无内容的消息会逃过所有下游的空值判断。被报告成真答案。列表里取字符串和字典的text键。用换行连接。

- `message_to_text(message, text_attribute_fallback=False)`。从整条消息提取显示文本。可以从属性读也可以从字典读。列表块用无分隔符连接。支持嵌套content。text_attribute_fallback为True时退到message.text属性。和`message_content_to_text`语义不同。不能互换。

- `get_original_user_content_text(content, additional_kwargs)`。有原始用户文本就用原始的。否则用content文本。

- `restore_original_human_message(message)`。构建面向UI的消息副本。原始文本从additional_kwargs取出。替换模型面向的文本。不改动实际发给模型的消息。混合内容在第一个文本位置还原。非文本块保留顺序。深拷贝保证隔离。

- `is_real_user_message(message)`。判断是不是真实用户写的HumanMessage。中间件注入的隐藏消息和总结标记不算。这些消息不该驱动用户意图功能。例如斜杠技能激活、MCP路由。

## 三、它和谁协作

它依赖langchain_core的HumanMessage。

它被`runtime/journal.py`依赖。事件记录用message_to_text和restore_original_human_message。

它被`runtime/goal.py`依赖。评估证据提取。

它被runtime.events的message_identity依赖。id后缀常量在那里也用。

它被输入护栏和用户意图判定依赖。

## 四、重要性评级

评级是6分。

理由如下。

消息文本提取是几乎所有事件记录和显示的基础。journal、goal、事件流全靠它。

`message_content_to_text`把None处理成空串。这个细节防止了无内容消息被报告成真答案。AGENTS.md有专门条目保护它的语义。

原始用户文本的还原处理了"模型看到的"和"用户写的"分离。历史记录必须持久化用户写的。

两个提取函数的语义差异被文档明确。不能互换。

扣4分是因为它是工具模块。没有状态。没有并发。但它被核心事件链直接依赖。分数高于一般工具。
