# deerflow.tui.runtime-档案

## 一、这个模块是干什么的

这个文件是DeerFlowClient流式和视图状态reducer之间的桥。

这个文件有两个层。

两个层都不碰Textual。

第一个层是translate函数。

translate是纯函数。

一个StreamEvent映射成零个或多个reducer动作。

第二个层是stream_actions函数。

stream_actions驱动client.stream。

stream_actions产出带首尾的动作序列。

首是RunStarted。

尾是RunEnded。

模型错误变成AssistantError行，而不是崩溃。

Textual应用在工作线程里跑stream_actions。

每个动作在UI线程上应用到reducer。

## 二、模块里的主要成员

### 1、translate函数

这个函数把单个StreamEvent映射成动作。

映射规则是这样的。

messages-tuple事件交给_translate_message。

end事件变成RunEnded，带用量。

values事件提取非空的标题，变成ThreadTitle。

custom事件不增量渲染，返回空。

### 2、_translate_message函数

这个函数处理消息事件。

ai类型产生两种动作。

文本非空就产生AssistantDelta。

带id和文本。

tool_calls产生ToolStarted。

每个调用一个动作，带id、名字、参数。

tool类型产生ToolResult。

错误状态从is_error或status推断。

### 3、_as_str函数

这个函数把值安全转成字符串。

None返回空字符串。

原因是None是显式的。

get的默认值会把None转成字符串None。

字符串None是truthy的，会骗过下游的空判断。

### 4、stream_actions函数

这个函数产出一次agent运行的动作流。

总是以RunStarted开始。

总是以RunEnded结束。

出错时先发AssistantError行再发RunEnded。

任何模型或运行时错误都在UI里呈现，不崩溃。

### 5、_extract_text函数

这个函数从内容提取文本。

内容可能是字符串。

可能是块列表。

字符串块和text块的文本拼接起来。

## 三、它和谁协作

它依赖deerflow.tui.view_state的动作类型。

它被tui.app的worker调用。

app遍历stream_actions的动作。

client被Protocol约束。

任何有stream方法的对象都能用。

## 四、重要性评级

评级是7分。

理由是这个文件是流式事件和UI状态之间的翻译层。

客户端的四种事件变成UI的动作。

错误在UI里呈现而不是崩溃。

这个层保持纯，可以直接测试。

不评高分的原因是翻译规则相对直接。

复杂性主要在view_state和client里。
