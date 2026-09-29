# AssistantRow档案

源码位置：backend/packages/harness/deerflow/tui/view_state.py

## 一、这个类是干什么的

AssistantRow是终端界面（TUI）对话记录里的一行。

AssistantRow代表AI助手说的一句话。

AI的回答是流式生成的。流式内容会一点点追加到同一个AssistantRow里。

AssistantRow是不可变的。类声明用了frozen=True。更新内容时会用replace生成新对象。

AssistantRow是一个纯数据类。AssistantRow不依赖Textual库。

## 二、类的成员

（一）字段

- text：助手回答的文本。流式过程中这个字段不断更新。
- id：消息id。默认是None。这个id用来匹配流式增量。同一个id的增量会合并到同一行。
- error：是否是错误行。默认是False。模型报错时创建的行error为True。
- kind：行的类型标识。默认值是"assistant"。

（二）方法

AssistantRow是dataclass。AssistantRow没有自定义方法。

## 三、它和谁协作

（一）上层来源

view_state.py里的三个函数会创建或更新AssistantRow。这三个函数是reduce、_apply_assistant_delta、_apply_assistant_delta_anonymous。

（二）匹配逻辑的关键角色

_apply_assistant_delta靠id字段找到已有的AssistantRow。找到后才合并增量。id为空的行走另一条按位置匹配的路径。AssistantRow的id字段是流式去重的关键。

（三）下游消费者

render.py读取AssistantRow并渲染。error为True时渲染成错误样式。

## 四、重要性评级

评级：4分。

理由：AssistantRow承载AI回答的主体内容。流式增量的合并逻辑都围绕AssistantRow的id展开。TUI的核心体验就是看AI回答。没有AssistantRow，整个对话界面就没有意义。但AssistantRow本身还是数据容器。逻辑在reduce函数里。所以给4分。
