# ToolResult档案

源码位置：backend/packages/harness/deerflow/tui/view_state.py

## 一、这个类是干什么的

ToolResult是一个动作类。

ToolResult表示一次工具调用结束了。

工具执行完毕。流事件里出现工具结果。translate把它翻译成ToolResult。reduce收到后更新对应的ToolRow卡片。更新内容有两个。状态从running变成ok或error。结果文本填进去。

有一个兜底路径。如果开始事件丢了、没有对应卡片，reduce会直接补一张已完成的卡片。这样结果不会因为开始事件丢失而消失。

判定错误的方式是两个条件的或。is_error标志为真，或者status等于error。

ToolResult是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- tool_call_id：工具调用的id。用于匹配已有卡片。
- content：工具结果的文本内容。
- is_error：是否执行出错。默认是False。
- tool_name：工具名字。默认是空字符串。兜底补卡片时用到。

（二）方法

ToolResult是dataclass。ToolResult没有自定义方法。

## 三、它和谁协作

（一）产生者

runtime.py的translate是产生者。translate把tool消息翻译成ToolResult。

（二）消费者

view_state.py的_apply_tool_result是消费者。它用message_format.py的format_tool_result处理结果文本。

## 四、重要性评级

评级：3分。

理由：ToolResult负责闭环工具调用的展示。用户要看工具执行成功还是失败。要看工具返回了什么。没有它，工具卡片会永远停在"运行中"。它的兜底路径保证结果不丢。给3分。
