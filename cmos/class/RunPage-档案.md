# RunPage档案

一、这个类是干什么的

RunPage是变更运行分页的数据类。这个类表示一页变更的运行加一个不透明游标。这个类是frozen dataclass。

二、类的成员

（一）字段

- items：RunStatusView元组。默认值是空元组。这个字段是这一页的变更运行。
- next_cursor：字符串或None。默认值是None。这个字段是下一页的游标。不透明。
- has_more：布尔值。默认值是False。这个字段表示还有没有更多页。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

RunEvidenceReader的list_changed_runs方法返回这个类。RunStatusView是items的元素类型。调用方在自己的输出持久化之后才保存next_cursor。

四、重要性评级

评级：4分。

理由：这个类是变更发现分页的载体。只有三个字段。所以重要性偏低。
