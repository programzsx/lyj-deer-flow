# ClearRows档案

源码位置：backend/packages/harness/deerflow/tui/view_state.py

## 一、这个类是干什么的

ClearRows是一个动作类。

ClearRows表示清空对话记录的显示。

用户在TUI里输入/clear命令。app.py把这条命令路由成ClearRows动作。reduce收到后把rows设为空元组。同时清空streaming_id和streaming_anonymous_row_index。

注意/clear只清显示。/clear不替换当前活动线程。线程id保持不变。

运行中不允许清空。app.py在流式状态下会拒绝/clear并提示"Still working"。

ClearRows是不可变的。类声明用了frozen=True。ClearRows没有字段。

## 二、类的成员

（一）字段

ClearRows没有字段。

（二）方法

ClearRows是dataclass。ClearRows没有自定义方法。

## 三、它和谁协作

（一）产生者

app.py的_handle_builtin是产生者。/clear命令派发这个动作。

（二）消费者

view_state.py的reduce是消费者。

## 四、重要性评级

评级：2分。

理由：ClearRows只负责一个显示清理动作。逻辑非常简单。但它是/clear命令的落点。没有它用户没法清理屏幕。给2分。
