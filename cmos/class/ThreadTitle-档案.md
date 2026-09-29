# ThreadTitle档案

源码位置：backend/packages/harness/deerflow/tui/view_state.py

## 一、这个类是干什么的

ThreadTitle是一个动作类。

ThreadTitle表示线程标题更新了。

Agent运行时会生成线程标题。标题通过values事件的title字段传来。runtime.py的translate把它翻译成ThreadTitle动作。reduce收到后更新ViewState的title字段。

标题还有一个下游用途。app.py的流worker会记录最新标题。运行正常结束后worker把标题写进threads_meta表。写标题用的是persistence.py的ThreadMetaWriter。

只有非空的标题才会生成动作。空标题被忽略。

ThreadTitle是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- title：线程标题文本。

（二）方法

ThreadTitle是dataclass。ThreadTitle没有自定义方法。

## 三、它和谁协作

（一）产生者

runtime.py的translate是产生者。translate处理values事件时提取title字段。

（二）消费者

view_state.py的reduce是消费者。app.py的_stream_worker也消费它。worker记录最新标题用于持久化。

## 四、重要性评级

评级：2分。

理由：ThreadTitle只负责线程标题。标题影响Web UI侧栏的显示效果。标题也影响用户识别会话。但缺了它对话功能不受影响。给2分。
