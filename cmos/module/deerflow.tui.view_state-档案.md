# deerflow.tui.view_state-档案

## 一、这个模块是干什么的

这个文件是TUI的纯视图状态reducer。

这个文件没有Textual和渲染依赖。

它把可见的对话建模成不可变的类型化行。

它定义了一小组动作。

它暴露一个纯的reduce函数。

函数签名是reduce(state, action)返回state。

保持这层纯让有趣的行为可以直接测试。

流式增量、工具卡片、错误行都能用合成动作测试。

不依赖任何终端。

运行时桥负责把StreamEvent翻译成这些动作。

Textual应用负责把ViewState渲染成控件。

两边都依赖这个模块，不互相依赖。

## 二、模块里的主要成员

### 1、行类型

行是对话记录的不可变单位。

#### （1）UserRow

UserRow表示用户消息。

只有text字段。

#### （2）AssistantRow

AssistantRow表示助手消息。

text是累计文本。

id是消息id。

error标记错误行。

#### （3）ToolRow

ToolRow表示一次工具调用。

有tool_call_id、tool_name、title、detail、result、status。

status是running、ok、error三种。

#### （4）SystemRow

SystemRow表示系统消息。

text加info或error的色调。

### 2、动作类型

动作是状态能变化的唯一途径。

动作有这些。

UserSubmitted是用户提交。

RunStarted是运行开始。

RunEnded是运行结束，带用量。

AssistantDelta是助手文本增量。

AssistantError是助手错误行。

ToolStarted是工具开始。

ToolResult是工具结果。

SystemMessage是系统消息。

ThreadTitle是线程标题。

ClearRows是清空。

### 3、ViewState数据类

ViewState是完整视图状态。

rows是行的元组。

streaming标记运行中。

usage是token用量。

title是标题。

streaming_id是正在生成的消息id。

streaming_anonymous_row_index是本轮匿名行的位置。

### 4、reduce函数

reduce是纯reducer。

按动作类型分发。

UserSubmitted追加用户行。

RunStarted重置流式标记。

RunEnded结束流式并记录用量。

AssistantError追加错误行。

SystemMessage追加系统行。

ThreadTitle更新标题。

ClearRows清空行。

#### （1）_apply_assistant_delta

这个函数处理助手增量。

有真实id的增量在全记录里匹配行。

不只是匹配最近的行。

原因是客户端每轮重发之前的消息。

重发的老消息可能在新消息开始后才到。

只匹配尾部会重复之前的回答。

文本合并按内容而不是盲目拼接。

新文本等于累计或以累计开头就是重发，替换。

累计以新文本开头就是过时的重发，保留。

否则是真正的增量，追加。

#### （2）_apply_assistant_delta_anonymous

这个函数处理空id的增量。

空id被每一轮的无id块共享。

空id不能在全记录里匹配。

匹配会让新一轮的文本并进老轮的无id行。

空id增量按位置跟踪本轮的行。

位置在每轮开始和结束时重置。

跟踪的行只在它还是最后一行时被复用。

工具卡片插入后空id增量开新行。

不会回溯到工具卡片之前的旧文本。

#### （3）_merge_stream_text

这个函数合并流文本。

区分累计重发、过时重发、真增量三种。

#### （4）_apply_tool_started

这个函数创建或更新工具卡片。

卡片按tool_call_id去重。

流式工具调用按id分成多个块。

名字先到，参数逐步增长。

没有id的块是参数碎片，丢弃。

#### （5）_apply_tool_result

这个函数应用工具结果。

没有匹配卡片的也照样显示结果。

## 三、它和谁协作

它依赖deerflow.tui.message_format的工具摘要。

它被deerflow.tui.runtime翻译层消费。

它被tui.app持有和折叠。

render层读它的行。

它是两侧的共同依赖。

## 四、重要性评级

评级是8分。

理由是这个文件是TUI的核心状态机。

流式增量、重发去重、空id路由、工具卡片全部在这里。

增量合并的边界情况处理得很细。

这层是纯的，所有行为都能直接测试。

不评9分以上的原因是它只服务TUI。

Gateway和Web UI不经过它。
