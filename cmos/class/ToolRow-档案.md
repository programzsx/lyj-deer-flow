# ToolRow档案

源码位置：backend/packages/harness/deerflow/tui/view_state.py

## 一、这个类是干什么的

ToolRow是终端界面（TUI）对话记录里的一行。

ToolRow代表一次工具调用的卡片。

Agent会调用工具。TUI把每次工具调用显示成一张卡片。这张卡片有标题、有详情、有状态、有结果。

ToolRow的生命周期是这样的。工具开始时创建一张卡片。卡片状态是running。工具结束后更新状态。状态变成ok或error。

ToolRow是不可变的。类声明用了frozen=True。更新时用replace生成新对象。

## 二、类的成员

（一）字段

- tool_call_id：工具调用的id。这个id是去重和匹配的关键。开始和结束事件靠这个id找到同一张卡片。
- tool_name：工具的名字。
- title：卡片的标题。标题由message_format.py的summarize_tool_title生成。
- detail：工具参数的详情。详情由format_tool_detail生成。
- result：工具的结果文本。结果由format_tool_result处理。
- status：状态。取值是running、ok、error三选一。默认是running。
- kind：行的类型标识。默认值是"tool"。

（二）方法

ToolRow是dataclass。ToolRow没有自定义方法。

## 三、它和谁协作

（一）上层来源

view_state.py里的_apply_tool_started创建ToolRow。_apply_tool_result更新ToolRow。

（二）去重机制

流式传输下同一次调用会分多个chunk到达。_apply_tool_started靠tool_call_id去重。重复的chunk只更新已有卡片。

（三）兜底路径

如果结束事件先到、开始事件丢了，_apply_tool_result会直接补一张卡片。这样结果不会丢失。

（四）下游消费者

render.py读取ToolRow并渲染成工具卡片。

## 四、重要性评级

评级：4分。

理由：工具调用是Agent执行的核心动作。用户要看清楚Agent在做什么。ToolRow就是工具活动的展示单元。没有ToolRow，工具执行过程对用户完全不可见。所以给4分。
