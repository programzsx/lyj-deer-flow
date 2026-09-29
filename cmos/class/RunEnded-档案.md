# RunEnded档案

源码位置：backend/packages/harness/deerflow/tui/view_state.py

## 一、这个类是干什么的

RunEnded是一个动作类。

RunEnded表示一轮Agent运行结束了。

runtime.py的stream_actions在运行结束后固定派发RunEnded。即使运行出错也会派发。这保证运行边界总是成对出现。

reduce收到RunEnded后做这些事。把streaming设为False。清空streaming_id。清空streaming_anonymous_row_index。更新token用量。

RunEnded是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- usage：token用量字典。默认是None。为None时reduce保留旧值。

（二）方法

RunEnded是dataclass。RunEnded没有自定义方法。

## 三、它和谁协作

（一）产生者

runtime.py的stream_actions是产生者。正常结束和异常结束都派发它。translate函数在处理end事件时也会生成它。

（二）消费者

view_state.py的reduce函数是消费者。app.py的_on_action靠RunEnded结束流式状态。app.py还会在收到RunEnded时立即刷新转录区。这样最终消息能切换到Markdown渲染。

## 四、重要性评级

评级：3分。

理由：RunEnded负责关闭一轮运行。它更新token用量。它保证流式状态不会卡在True。流式状态卡住的话整个界面会一直显示"运行中"。所以它很重要。但它逻辑简单。给3分。
