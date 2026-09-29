# UserSubmitted档案

源码位置：backend/packages/harness/deerflow/tui/view_state.py

## 一、这个类是干什么的

UserSubmitted是一个动作类。

动作类表示状态的一次变化请求。

UserSubmitted表示用户提交了一条消息。

用户在输入框按下回车。app.py创建UserSubmitted动作。reduce收到这个动作后往rows里追加一个UserRow。

UserSubmitted是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- text：用户提交的文本。

（二）方法

UserSubmitted是dataclass。UserSubmitted没有自定义方法。

## 三、它和谁协作

（一）产生者

app.py的on_input_submitted是主要产生者。用户提交输入框内容时派发这个动作。

（二）消费者

view_state.py的reduce函数是消费者。reduce收到UserSubmitted后追加UserRow。

## 四、重要性评级

评级：2分。

理由：UserSubmitted只是一个单字段的数据包。但它是用户输入进入状态系统的唯一入口。没有它用户消息进不了对话记录。所以给2分。
