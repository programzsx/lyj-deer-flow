# message_identity-档案

## 一、这个类是干什么的

message_identity不是类。

message_identity是runtime/events/message_identity.py里的模块级函数。

它返回持久化消息的稳定UI身份。

thread feed（run_events）和checkpoint在同一个id下持有同一条消息。

客户端对齐它们的前提是两边对"同一条消息"的理解一致。

这是那个规则的后端一半。

前端一半是frontend的messageIdentity。

两边必须同步。

不匹配是静默的。

降级放置而不是抛错。

两种规整很重要。

第一种，ToolMessage由tool_call_id标识，不是自己的id。那是两边总能解析的id。

第二种，DynamicContextMiddleware把提交的用户轮从X重键成X__user。X给注入的提醒。两个人类副本必须折叠成一个身份。

这个模块位于backend/packages/harness/deerflow/runtime/events/message_identity.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、message_identity函数

输入是序列化的消息映射。

不是BaseMessage。

规则如下。

tool_call_id是非空字符串时返回"tool:{tool_call_id}"。

id缺失时返回None。

type为human时剥掉注入的用户消息id后缀。

只有human副本折叠。

隐藏的SystemMessage合法地复用原始id。

把它和可见轮合并会隐藏那一轮。

### 2、attach_message_seq函数

这个函数返回消息的浅拷贝，seq放在MESSAGE_SEQ_KEY下。

MESSAGE_SEQ_KEY的值是"deerflow_seq"。

这是worker的运行级stamper和请求级stamper共享的唯一定义表达式。

同一规则的两个对应方不能悄悄分叉。

输入绝不被修改。

seq是服务端拥有的展示元数据。

它在帧序列化时附加。

客户端发回的任何东西都必须剥掉它。

否则重放的消息会把它写进checkpoint。

fork会重新播种并重新分配seq。

## 三、它和谁协作

- 运行worker的消息stamper用attach_message_seq。
- frontend的messageIdentity是对应的前端一半。
- strip_injected_user_message_id_suffix处理human副本折叠。

## 四、重要性评级

评级是6分。

理由如下。

这个函数是消息UI身份的规则。

thread feed和checkpoint靠它对齐。

ToolMessage用tool_call_id标识是两边总能解析的id。

human副本折叠防止注入消息分成两个身份。

单一stamper表达式防分叉。

seq必须从客户端回传剥掉。

但它是身份辅助函数。

扣掉4分。
