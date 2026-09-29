# ViewState档案

源码位置：backend/packages/harness/deerflow/tui/view_state.py

## 一、这个类是干什么的

ViewState是终端界面（TUI）的完整视图状态。

ViewState用一个不可变的元组保存整个对话记录。对话记录由四种行组成。四种行是UserRow、AssistantRow、ToolRow、SystemRow。

ViewState除了记录行之外，还记录几个界面状态。是否正在流式输出。token用量。线程标题。当前正在流式输出的行。

ViewState的设计是纯函数式的。修改状态不直接改对象。修改状态通过reduce函数。reduce函数接收旧状态和动作。reduce函数返回新状态。旧状态保持不变。

这种设计让TUI的核心行为可以脱离终端测试。测试只需要构造动作序列。测试用pytest直接跑。

## 二、类的成员

（一）字段

- rows：行的元组。这是对话记录的主体。默认是空元组。
- streaming：是否正在流式输出。默认是False。RunStarted时变True。RunEnded时变False。
- usage：token用量字典。默认是None。RunEnded动作会更新它。
- title：线程标题。默认是None。ThreadTitle动作会更新它。
- streaming_id：当前正在流式输出的消息id。只有这一行在流式期间渲染成纯文本。其他历史行保持Markdown渲染。
- streaming_anonymous_row_index：本轮接收增量的无id行的位置。这个字段解决空id增量的匹配问题。

（二）相关函数

- initial_state：构造初始状态。
- reduce：唯一的reducer。接收state和action。返回新state。reduce是纯函数。

## 三、它和谁协作

（一）动作来源

runtime.py的stream_actions驱动client流式输出。stream_actions把流事件翻译成动作。app.py把这些动作喂给reduce。

（二）reducer

reduce函数根据动作类型更新ViewState。动作包括用户提交、运行开始结束、增量、错误、工具开始结束、系统消息、标题、清空。

（三）下游消费者

app.py持有ViewState。app.py调用render.py把ViewState渲染成终端界面。render_transcript读取rows和streaming_id。

## 四、重要性评级

评级：6分。

理由：ViewState是TUI的测试核心。文档说这是testable heart。所有界面逻辑都围绕ViewState展开。没有ViewState，流式渲染、工具卡片、错误显示全都没有。但ViewState本身是纯数据。逻辑在reduce函数里。所以给6分。
