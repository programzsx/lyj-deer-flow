# deerflow.runtime.events.message_identity

## 一、这个模块是干什么的

这个模块回答一个问题。

问题是"两条消息怎么才算同一条消息"。

背景是这样的。

线程消息流和检查点存的是同一条消息。

两边用同一个id。

客户端才能把两边对齐。

但前提是两边对"同一条消息"的判定规则一致。

这个模块是后端一半的规则。

前端一半的规则在frontend的hooks里。

两边必须保持同步。

因为不一致是静默的。

不一致不会报错。

不一致只会让消息排错位置。

有两种归一化规则。

第一种，工具消息用它自己的id。

工具消息的稳定身份不是它的message id。

它的稳定身份是tool_call_id。

因为只有这个id两边永远能解析到。

第二种，动态上下文中间件会改写用户输入的id。

它把X改写成X__user。

所以同一次提交的人类消息有两个副本。

这两个副本必须折叠成一个身份。

还有MESSAGE_SEQ_KEY这个常量。

它是additional_kwargs里的键，携带消息在线程流里的序列号。

它是服务端拥有的展示元数据。

客户端发回的副本必须剥掉它。

否则重放的消息会把它写进检查点。

## 二、模块里的主要成员

- message_identity(message)：返回消息的稳定身份。工具消息返回tool:{tool_call_id}。普通消息返回message:{id}。人类消息的id先剥掉注入后缀再折叠。
- attach_message_seq(message, seq)：返回消息的浅拷贝。拷贝里在additional_kwargs下带上了序列号。输入永远不被修改。
- MESSAGE_SEQ_KEY：序列号的键名，值是deerflow_seq。

## 三、它和谁协作

- 它被runtime/events/message_seq.py引用。
- 它被runtime/runs/worker.py引用。worker的序列号打戳器用它。
- 它被runtime/events/store/下的存储层引用。
- 它依赖utils/messages里的后缀剥离函数。

## 四、重要性评级

评级是7分。

理由是它是前后端消息对齐规则的后端锚点。

对齐失败是静默的，只表现为消息错位。

用户会看到重复或乱序的消息。

这种问题极难排查，所以规则必须收敛在一个地方。
