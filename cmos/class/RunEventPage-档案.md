# RunEventPage档案

一、这个类是干什么的

RunEventPage是单个运行的事件流分页的数据类。这个类表示从已知运行的持久事件流里取的一页。这个类是frozen dataclass。

二、类的成员

（一）字段

- items：RunEventView元组。默认值是空元组。这个字段是这一页的事件。
- next_after_seq：整数或None。默认值是None。这个字段是下一页的起始序号。
- has_more：布尔值。默认值是False。这个字段表示还有没有更多页。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

RunEvidenceReader的list_run_events方法返回这个类。RunEventView是items的元素类型。

四、重要性评级

评级：4分。

理由：这个类是事件流分页的载体。只有三个字段。所以重要性偏低。
