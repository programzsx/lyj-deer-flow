# deerflow.tui.render-档案

## 一、这个模块是干什么的

这个文件是TUI的纯Rich渲染器模块。

它接收ViewState和轻量会话信息。

它返回Rich渲染对象。

它不导入Textual。

所以可以直接渲染到Rich的Console并检查文本来测试。

## 二、模块里的主要成员

### 1、render_transcript函数

这个函数渲染对话记录。

没有行时显示空状态提示。

正在生成的消息渲染成纯文本。

其他消息全部渲染成Markdown。

正在生成的用纯文本是为了避免Markdown重排的跳动。

历史用Markdown是为了后续轮不把之前的回答打回原文。

每个块之间有一行空行。

### 2、render_row函数

这个函数渲染一行。

四种行各有自己的渲染。

UserRow是加粗的用户色文本。

AssistantRow是Markdown渲染加说话者标记。

说话者标记用表格网格对齐到顶部。

出错的AssistantRow是错误色纯文本。

SystemRow是斜体系统文本。

错误色调是错误色。

### 3、_render_tool函数

这个函数渲染工具行。

头部有工具符号、标题、详情、状态符号。

状态有running、ok、error三种。

各有自己的符号和颜色。

有结果且不在运行中时结果跟在下面。

### 4、render_status函数

这个函数渲染状态栏。

状态栏显示工作状态、标题、模型、线程标签、token用量。

运行中显示转轮和esc中断提示。

空闲显示ready。

### 5、render_palette函数

这个函数渲染斜杠命令面板。

面板是窗口化的列表。

一次最多显示8条。

高亮一条。

超出时显示还有多少条。

### 6、render_header函数

这个函数渲染顶栏。

顶栏显示模型、线程标签、当前目录、技能数。

## 三、它和谁协作

它依赖deerflow.tui.theme的颜色和符号。

它依赖deerflow.tui.view_state的行类型。

它被tui.app调用。

app用它渲染transcript、状态栏、面板、顶栏。

它依赖Rich库。

## 四、重要性评级

评级是4分。

理由是这个文件决定TUI的全部视觉呈现。

流式期间的文本稳定处理是主要价值。

正在生成的消息用纯文本避免跳动。

历史保持Markdown渲染。

不评高分的原因是它是纯渲染。

没有行为，只是把状态画出来。
