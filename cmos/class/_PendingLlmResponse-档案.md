# _PendingLlmResponse档案

源码位置：`backend/packages/harness\deerflow/runtime/journal.py`

## 一、这个类是干什么的

这个类是一个暂存结构。

这个类暂存"一份还没定稿的LLM响应事件"。

它解决的问题是provider的二次回调。

有些provider会对同一个LangChain run_id触发两次`on_llm_end`。

第一次没有usage数据。

或者token计数全是0。

第二次立刻补上usage数据。

RunJournal收到第一次回调时。

事件还不能直接进缓冲。

因为usage可能马上就到。

所以先暂存在这个类里。

等第二次回调带着usage来了。

把usage合并进暂存的事件。

然后一起提交进缓冲。

如果没有第二次回调。

下一个不相关的事件、缓冲达到阈值、显式flush。

都会触发提交。

这个类只保留不可变的部分。

事件列表、消息数、最后AI消息。

这些是第一次回调的规范数据。

provider可能修改并复用同一个response对象。

所以消息对象本身不能保留。

只保留已经dump出来的字典。

这个类是模块私有的。

类名以下划线开头。

只有RunJournal内部使用它。

## 二、类的成员

### （一）字段

- `llm_run_id`：这个响应对应的LangChain run_id。字符串。用于识别是不是同一个响应的二次回调。
- `events`：暂存的事件字典列表。这些事件是第一次回调产出的规范数据。usage合并会直接修改这个列表里的事件。
- `message_count`：消息数。冻结的摘要字段。提交时累加进RunJournal的计数。
- `last_ai_message`：最后AI消息的文本。字符串或None。冻结的摘要字段。提交时写进RunJournal的便利字段。

### （二）方法

这个类没有方法。

dataclass自动生成`__init__`等方法。

这个类只承载数据。

## 三、它和谁协作

这个类和RunJournal协作。

RunJournal的`_pending_llm_response`字段持有这个类的实例。

同一时间最多暂存一份。

`_queue_llm_response_events`创建它。

同一个run_id的usage回放来了。

`_merge_response_event_usage`把usage合并进它的事件。

然后`_commit_pending_llm_response`提交它。

提交就是把它的事件扩展进`_buffer`。

把消息数和最后AI消息累加进RunJournal的字段。

然后清空暂存位。

## 四、重要性评级

评级：4分（满分10分）。

理由：

- 这个类是纯数据类。
- 没有任何方法。
- 但它承载的暂存语义是响应合并正确性的关键。
- 没有它，第一次没有usage的回调要么丢事件。
- 要么把可能被provider修改的消息对象留得太久。
- 数据类评4到6分。
- 它是RunJournal内部的一个辅助结构。
- 影响面限于单次LLM响应的处理。
- 评4分。
