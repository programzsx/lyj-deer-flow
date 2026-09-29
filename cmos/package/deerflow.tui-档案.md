# deerflow.tui-档案

## 一、这个包是干什么的

这个包是终端工作台。

用户可以在终端里和智能体对话。
不需要浏览器。
不需要Gateway。
不需要Next.js前端。

这个包是一个终端原生的UI。
它嵌入式地使用`DeerFlowClient`。
它作为`deerflow`控制台脚本暴露。

它是UI外壳。
它不改变智能体的行为。
它复用嵌入式客户端的全部能力。

它依赖`textual`库。
`textual`是可选依赖。
没有`textual`时控制台脚本降级为无头帮助。

## 二、包里的主要成员

### （一）模块__init__.py和__main__.py

`__init__`只有一行文档字符串。

`__main__`支持`python -m deerflow.tui`调用方式。

### （二）模块cli.py——命令行入口

#### 1、plan_launch函数

这个函数是纯的启动模式决策函数。
它根据argv、TTY状态、环境决定启动方式。

模式有四种。

- tui。TTY上打开终端UI。
- print。无头一次性。打印结果。
- json。无头一次性。输出JSON。
- headless-help。无头帮助。

TTY进TUI。
非TTY进无头帮助。

`LaunchPlan`携带决策结果。
有mode、message、thread_id、recursion_limit、transparent等字段。

#### 2、main函数

这个函数是入口点。
它把决策接到嵌入式客户端。
只在真正打开UI时懒导入Textual应用。
所以`deerflow`控制台脚本在`textual`不存在时仍能跑无头命令。

`--tui-transparent`选项和`DEER_FLOW_TUI_TRANSPARENT`环境变量。
它们选用终端默认背景。
不改变纯色主题默认。

它使用绝对导入`from deerflow.tui.app import run_tui`。
所以app.py的模块名不会触发边界测试。

### （三）模块view_state.py——视图状态

`ViewState`加`reduce`是可测试的核心。

行类型有四种。

- `UserRow`。用户输入。
- `AssistantRow`。助手回复。
- `ToolRow`。工具调用和结果。
- `SystemRow`。系统消息。

动作类型有多个。

- `UserSubmitted`。用户提交。
- `RunStarted`和`RunEnded`。运行开始和结束。
- `AssistantDelta`。助手流式增量。
- `AssistantError`。助手错误。
- `ToolStarted`和`ToolResult`。工具开始和结果。
- `SystemMessage`。系统消息。
- `ThreadTitle`。线程标题。
- `ClearRows`。清空行。

`reduce`是纯函数。
给定state和action返回新的state。
标题从values事件捕获。

助手增量有两种应用。
带消息id的。
匿名的。
流式文本合并处理增量。

### （四）模块runtime.py——事件翻译

`translate`把StreamEvent翻译成Action列表。
翻译是纯函数。

`stream_actions`包装一次运行。
它在运行前后加`RunStarted`和`RunEnded`。
把模型错误变成`AssistantError`行。

它返回Action的迭代器。
app.py消费这个迭代器。

### （五）模块app.py——Textual应用

`DeerFlowTUI`是Textual的App。

它在一个worker线程上运行`DeerFlowClient.stream()`。
同步调用。
通过`call_from_thread`把动作marshal到UI线程。

它有斜杠面板。
面板支持`/goal`管理。
有模型和线程的模态选择器。

它路由空闲的仅显示命令`/clear`。
`/clear`通过`ClearRows`清空行。
不替换活跃线程。

它在运行中阻止重置状态的本地命令。
例如`/new`和`/clear`。
阻止时显示标准的"Still working"消息。

它有优先级键绑定。
键绑定由`check_action`门控。
键绑定不从overlay或composer偷键。

应用级PageUp和PageDown滚动transcript。
滚动保持composer焦点。
流式跟随输出。
只在transcript在底部时。

`SelectScreen`是模态选择屏幕。
`run_tui`是启动入口。

### （六）模块message_format.py——消息格式化

格式化工具消息的显示。
`truncate`截断文本。
`summarize_tool_title`摘要工具标题。
`format_tool_detail`格式化工具详情。

### （七）模块command_registry.py——命令注册表

注册斜杠命令。
`resolve`解析命令。

注册表必须排除共享的`RESERVED_SLASH_SKILL_NAMES`条目。
智能体运行时的选择器和解析器都拒绝这些条目。
context技能是例外。
用于普通任务文本。
精确的composer专用别名`/context compact`不可作为技能激活。

### （八）模块input_history.py——输入历史

记录输入历史。
上箭头和下箭头浏览历史。

### （九）模块render.py——渲染

`render_transcript`渲染整个transcript。
`render_row`渲染单行。
助手行按markdown渲染。
`render_status`渲染状态栏。
状态栏有模型、线程标签、spinner、耗时。
`render_palette`渲染面板。
`render_header`渲染头部。
头部有模型、线程标签、cwd、技能数。

### （十）模块theme.py——主题

定义TUI的主题色。

### （十一）模块session.py——会话

`Session`构建客户端和checkpointer。
`open_session`打开一个会话。
会话持有嵌入式客户端。

### （十二）模块persistence.py——线程元数据持久化

`ThreadMetaWriter`写threads_meta行。

Web UI从threads_meta SQL表列线程。
不是从checkpointer。
`persistence.py`在默认用户下写threads_meta行。
写到Gateway读的同一个数据库。
通过harness专用的`init_engine_from_config()`。
所以TUI会话出现在Web UI侧边栏。
不需要运行Gateway。

尽力而为。
memory后端上是无操作。

所有数据库工作在一个长驻的后台事件循环上运行。
SQLAlchemy异步引擎绑定到它的创建循环。
`_LoopThread`承载这个循环。

### （十三）模块widgets/——组件

`ComposerInput`是带宽字符光标修复的输入组件。

Textual的`Input._cursor_offset`在光标在值末尾时无条件加一。
双宽（CJK）字符之后会超出一格。
 misplaced硬件/IME光标。
在iTerm2等终端里输入中文时看到漂移。

英文名不经过IME。
所以漂移只在CJK出现。

修复是返回真实的光标单元偏移。
不加Textual的末尾加一。
屏幕上的块光标由character-index styling单独绘制。
不受影响。
这个修复只纠正终端光标锚点。
IME候选窗口跟随这个锚点。

### （十四）测试

测试分几层。

- 纯层。view_state、runtime、message_format等。直接用pytest。
- 应用层。palette、overlay。用Textual的pilot harness。带假的进程内会话。
- 持久化层。`test_tui_persistence.py`测threads_meta往返。

## 三、它和谁协作

上游是嵌入式客户端。
`DeerFlowClient`提供全部智能体能力。
TUI是它的UI外壳。

下游是Textual库。
Textual提供终端UI框架。

它和持久化系统协作。
threads_meta写进Gateway读的同一个数据库。
所以TUI会话出现在Web UI侧边栏。

它和skills系统协作。
命令注册表排除保留的斜杠名。

它和配置系统协作。
`textual`是可选依赖。
在backend的dev group里。

## 四、重要性评级

评级：4分。

理由如下。

这个包是独立的用户界面。
它让用户在终端里使用智能体。
不需要浏览器和Gateway。

它不是核心路径。
Gateway和Web UI是主要入口。
TUI是备选入口。
删除它，终端用户失去界面。
Web UI和IM通道不受影响。

它被引用面很小。
约22个文件提到它。
主要是它自己的模块和测试。

它的设计质量高。
纯层和UI层分离。
view_state加reduce是可测试的核心。
CJK光标修复细致。

它作为控制台脚本暴露。
`deerflow`脚本。
脚本降级为无头帮助时不需要textual。

所以给4分。
独立UI，运行时可选。
