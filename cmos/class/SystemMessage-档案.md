# SystemMessage档案

源码位置：backend/packages/harness/deerflow/tui/view_state.py

## 一、这个类是干什么的

SystemMessage是一个动作类。

SystemMessage表示要显示一条系统提示。

app.py里的很多地方派发这个动作。帮助文本。未知命令的警告。"Started a new thread"。"Interrupted"。"Still working"。

reduce收到后追加一行SystemRow。tone为error时渲染成错误样式。

SystemMessage是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- text：提示文本。
- tone：语气。取值是info、error二选一。默认是info。

（二）方法

SystemMessage是dataclass。SystemMessage没有自定义方法。

## 三、它和谁协作

（一）产生者

app.py的各命令处理函数是主要产生者。_handle_submit、_handle_builtin、_dispatch_still_working等。

（二）消费者

view_state.py的reduce是消费者。reduce追加SystemRow。

## 四、重要性评级

评级：2分。

理由：SystemMessage承载的是辅助性提示。它不影响核心对话。但没有它用户得不到任何命令反馈。给2分。
