# UserRow档案

源码位置：backend/packages/harness/deerflow/tui/view_state.py

## 一、这个类是干什么的

UserRow是终端界面（TUI）对话记录里的一行。

UserRow代表用户说的一句话。

用户在输入框提交一条消息。TUI就会创建一个UserRow。

UserRow被追加到ViewState的rows元组里。这样对话记录里就多了一行用户发言。

UserRow是不可变的。类声明用了frozen=True。创建了就不能改。

UserRow是一个纯数据类。UserRow不依赖Textual库。UserRow可以在没有终端的环境下做单元测试。

## 二、类的成员

（一）字段

- text：用户输入的文本内容。
- kind：行的类型标识。默认值是字符串"user"。这个字段用来在渲染时区分行。

（二）方法

UserRow是dataclass。UserRow没有自定义方法。UserRow只有dataclass自动生成的方法。

## 三、它和谁协作

（一）上层来源

view_state.py里的reduce函数负责创建UserRow。用户提交消息时，reduce收到UserSubmitted动作。reduce就生成一个UserRow追加进去。

（二）下游消费者

render.py的渲染函数读取rows列表。渲染函数根据kind字段判断行类型。渲染函数把UserRow渲染成用户发言的样式。渲染时用theme.py里的user颜色。

## 四、重要性评级

评级：2分。

理由：UserRow只是一个简单的数据容器。UserRow只有两个小字段。但UserRow是对话记录的基本单元之一。没有UserRow，用户发言就无法显示。缺了它整个TUI看不到用户输入。所以给2分。
