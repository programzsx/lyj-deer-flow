# Theme档案

源码位置：backend/packages/harness/deerflow/tui/theme.py

## 一、这个类是干什么的

Theme是TUI的颜色主题定义。

Theme用一个dataclass装着一组颜色常量。这些颜色是Tokyo-Night风格的调色板。整体风格是冷静的。在深色终端上可读性好。

Theme的颜色用Rich兼容的十六进制格式。同样的常量同时驱动两处。一处是Rich的渲染组件。另一处是Textual的CSS变量。两边不会不一致。

模块级有一个THEME实例。模块级还有一个SYMBOLS字典。SYMBOLS装着各类符号。用户符号、助手符号、工具符号、运行状态符号、勾叉符号、加载动画的转轮字符。

## 二、类的成员

（一）字段

- bg：背景色。默认#1a1b26。
- panel：面板色。默认#1f2335。
- border：边框色。默认#2f334d。
- text：正文色。默认#c0caf5。
- dim：弱化色。
- muted：静音色。
- primary：主强调色。用于标题和应用强调。
- user：用户发言颜色。
- assistant：助手发言颜色。
- tool：工具活动颜色。
- accent：成功色。
- warning：运行中或警告色。
- error：错误色。

（二）方法

Theme是frozen dataclass。Theme没有自定义方法。

## 三、它和谁协作

（一）使用者

app.py的CSS用THEME拼接样式。render.py的渲染函数用THEME上色。SYMBOLS被app.py用于状态栏的转轮和各类符号。

## 四、重要性评级

评级：1分。

理由：Theme只是颜色常量的容器。它不影响任何逻辑。缺了它TUI照样运行，只是配色要另写。给1分。
