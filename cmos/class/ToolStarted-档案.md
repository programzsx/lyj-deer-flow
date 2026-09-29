# ToolStarted档案

源码位置：backend/packages/harness/deerflow/tui/view_state.py

## 一、这个类是干什么的

ToolStarted是一个动作类。

ToolStarted表示一次工具调用开始了。

Agent决定调用工具。流事件里出现工具调用chunk。translate把它翻译成ToolStarted。reduce收到后创建或更新一张ToolRow卡片。

流式传输下同一次调用会分多个chunk到达。第一个chunk带工具名。后面的chunk带逐渐增长的参数。这些chunk靠tool_call_id聚合到同一张卡片。

没有id的chunk是参数碎片噪音。reduce会丢弃它们。

ToolStarted是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- tool_call_id：工具调用的id。空id的chunk会被丢弃。
- tool_name：工具的名字。
- args：工具参数字典。默认是空字典。

（二）方法

ToolStarted是dataclass。ToolStarted没有自定义方法。

## 三、它和谁协作

（一）产生者

runtime.py的translate是产生者。translate把AI消息里的tool_calls翻译成ToolStarted。

（二）消费者

view_state.py的_apply_tool_started是消费者。它按tool_call_id去重。它用message_format.py的format_tool_detail和summarize_tool_title生成详情和标题。

## 四、重要性评级

评级：3分。

理由：ToolStarted是工具卡片的起点。没有它，用户看不到Agent开始调用工具。工具执行过程对用户不可见。它的去重逻辑处理了流式chunk的真实问题。给3分。
