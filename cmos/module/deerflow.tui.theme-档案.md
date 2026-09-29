# deerflow.tui.theme-档案

## 一、这个模块是干什么的

这个文件是TUI的颜色和符号调色板。

调色板是Tokyo-Night风格。

颜色沉着，在深色终端上可读。

几个强调色区分说话者和工具状态。

颜色是Rich兼容的十六进制。

同一批常量驱动Rich渲染对象和Textual的CSS变量。

## 二、模块里的主要成员

### 1、Theme数据类

Theme是冻结的颜色集合。

颜色有这些。

bg是背景色。

panel是面板色。

border是边框色。

text是正文色。

dim、muted是弱化色。

primary是主色。

user是用户说话者色。

assistant是助手说话者色。

tool是工具活动色。

accent是成功色。

warning是运行警告色。

error是错误色。

THEME是模块级的单例。

### 2、SYMBOLS常量

SYMBOLS是符号集合。

user是›。

assistant是●。

tool是齿轮符号。

running和ok和error是状态符号。

system是·。

spinner是十个转轮帧。

## 三、它和谁协作

它被tui.render引用。

渲染器用THEME上色，用SYMBOLS标记状态。

它被tui.app引用。

app的CSS用THEME的颜色。

它不依赖任何其他deerflow模块。

## 四、重要性评级

评级是2分。

理由是这个文件是TUI视觉风格的单一来源。

颜色和符号集中在一个地方。

Rich渲染和Textual CSS用同一批常量。

风格不会分裂。

不评高分的原因是它只有常量。

没有任何行为。

纯粹是数据。
