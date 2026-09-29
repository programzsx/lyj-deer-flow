# AssistantDelta档案

源码位置：backend/packages/harness/deerflow/tui/view_state.py

## 一、这个类是干什么的

AssistantDelta是一个动作类。

AssistantDelta表示AI回答的一小段流式增量。

模型的回答是流式输出的。输出内容按chunk一点点到达。每个chunk被翻译成一个AssistantDelta。reduce把增量合并到对应的AssistantRow里。

AssistantDelta的id字段很关键。id有两种情况。

情况一。id是真实的消息id。reduce会在整个转录里扫描匹配这个id的行。扫描不只是找最近一行。原因是客户端在新一轮会重发历史消息。重发的旧消息可能在新消息之后到达。只匹配尾部会造成重复答案。

情况二。id是空字符串。有些供应商不给chunk打id。空id不是可靠的匹配键。空id被所有轮次的无idchunk共享。按id匹配会把新一轮的文字合并进旧轮的行里。所以空id的增量走单独的按位置匹配的路径。

AssistantDelta是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- id：消息id。可能是真实id，也可能是空字符串。
- text：本段增量的文本。

（二）方法

AssistantDelta是dataclass。AssistantDelta没有自定义方法。

## 三、它和谁协作

（一）产生者

runtime.py的translate是产生者。translate把messages-tuple事件里的AI文本翻译成AssistantDelta。

（二）消费者

view_state.py的_apply_assistant_delta是消费者。空id走_apply_assistant_delta_anonymous。

（三）合并策略

合并按内容判断而不是盲目拼接。新文本等于已有文本或以已有文本开头，属于重发，直接替换。已有文本以新文本开头，属于过期重发，保留原样。其他情况是真实增量，拼接。

## 四、重要性评级

评级：4分。

理由：AssistantDelta是流式体验的核心载体。TUI最重要的体验就是看着AI回答一点点出现。它的id匹配逻辑解决了重发、累计快照、跨轮混淆等多个真实问题。没有它就没有流式效果。给4分。
