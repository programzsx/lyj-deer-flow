# SystemRow档案

源码位置：backend/packages/harness/deerflow/tui/view_state.py

## 一、这个类是干什么的

SystemRow是终端界面（TUI）对话记录里的一行。

SystemRow代表系统提示信息。

系统提示信息的例子有这些。帮助文本、"Started a new thread"、"Interrupted"、"Still working"这类提示。

SystemRow带一个语气字段。语气决定渲染样式。info是普通信息。error是错误信息。

SystemRow是不可变的。类声明用了frozen=True。

SystemRow是一个纯数据类。SystemRow不依赖Textual库。

## 二、类的成员

（一）字段

- text：系统提示的文本内容。
- tone：语气。取值是info、error二选一。默认是info。
- kind：行的类型标识。默认值是"system"。

（二）方法

SystemRow是dataclass。SystemRow没有自定义方法。

## 三、它和谁协作

（一）上层来源

view_state.py里的reduce函数负责创建SystemRow。reduce收到SystemMessage动作后生成SystemRow。app.py里的很多命令处理函数会派发SystemMessage动作。比如_unknown命令的提示、/help的帮助文本。

（二）下游消费者

render.py读取SystemRow并渲染。tone为error时渲染成错误样式。渲染时用theme.py里的相应颜色。

## 四、重要性评级

评级：2分。

理由：SystemRow只承载辅助性的提示文本。SystemRow不影响Agent执行。但没有SystemRow，用户得不到命令反馈。用户会不知道命令成没成功。所以给2分。
