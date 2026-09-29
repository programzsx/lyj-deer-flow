# InboundMessageType档案

## 一、这个类是干什么的

InboundMessageType是入站消息类型的枚举。

它区分两种入站消息。

普通聊天消息。

命令消息。

用户发了一句"帮我写个报告"。

这是普通聊天。

用户发了"/new"。

这是命令。

调度器对这两种消息走完全不同的路径。

聊天消息走智能体运行。

命令消息走本地命令处理。

## 二、类的成员

### （一）枚举值

1、CHAT

普通聊天消息。

值是字符串"chat"。

调度器对它做线程查找或创建、运行参数解析、智能体调用。

2、COMMAND

命令消息。

值是字符串"command"。

调度器对它走_handle_command，处理/new、/status、/agent等已知命令。

### （二）实现说明

它继承StrEnum。

所以枚举值可以直接当字符串用。

日志里可以直接打印它的value。

## 三、它和谁协作

InboundMessageType是渠道体系的入站消息类型标记。

它被InboundMessage的msg_type字段使用。

各渠道子类在构造InboundMessage时判断消息文本是不是已知命令，赋给它。

ChannelManager读它决定走聊天处理还是命令处理。

它由app.channels.commands里的is_known_channel_command辅助判断。

## 四、重要性评级

评级：4分。

理由如下。

它是命令和聊天的分界标记。

没有它，"/new"这样的命令会被当成聊天发给智能体。

它的实现极简，只有两个值。

它只是类型标记，没有行为。所以只有4分。
