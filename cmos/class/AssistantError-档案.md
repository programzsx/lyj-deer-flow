# AssistantError档案

源码位置：backend/packages/harness/deerflow/tui/view_state.py

## 一、这个类是干什么的

AssistantError是一个动作类。

AssistantError表示一轮运行中出现了错误。

模型报错或运行时报错时，错误不能让TUI崩溃。runtime.py的stream_actions捕获异常。stream_actions把异常翻译成AssistantError动作。reduce收到后追加一行error为True的AssistantRow。

用户看到的效果是。错误以红色错误行的形式显示在对话里。

AssistantError是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- text：错误文本。stream_actions用异常的字符串表示填充。

（二）方法

AssistantError是dataclass。AssistantError没有自定义方法。

## 三、它和谁协作

（一）产生者

runtime.py的stream_actions是主要产生者。stream_actions捕获所有异常。异常为空字符串时用类名兜底。cli.py的_error_text也遵循同样约定。

（二）消费者

view_state.py的reduce是消费者。reduce追加AssistantRow（error=True）。render.py渲染成错误样式。

## 四、重要性评级

评级：3分。

理由：AssistantError是错误兜底的关键。没有它，模型报错会让TUI直接崩溃。用户的体验会是闪退而不是看到错误信息。它的逻辑简单。但作用是保护性的。给3分。
