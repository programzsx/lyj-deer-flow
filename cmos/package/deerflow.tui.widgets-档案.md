# deerflow.tui.widgets-档案

## 一、这个包是干什么的

这个包是TUI的组件集合。

TUI的界面由组件构成。
组件是输入框、面板、列表等UI元素。

这个包目前只有一个组件。
`ComposerInput`。
它是用户输入框。

这个包很小。
一个`__init__`。
一个composer.py。
但它解决一个真实的用户体验问题。

## 二、包里的主要成员

### （一）模块__init__.py——公共出口

只有一行文档字符串。
声明这是DeerFlow TUI的Textual组件。

### （二）模块composer.py——ComposerInput

#### 1、问题

Textual的`Input._cursor_offset`有一个bug。

这个方法在光标位于值末尾时无条件加一。
加一的目的是对齐屏幕列。
但在双宽字符之后会超出一格。

双宽字符就是CJK字符。
一个中文字符占两个终端列。
光标在中文之后时。
加一让光标位置超出实际位置一格。

后果是硬件光标和IME光标 misplaced。
硬件光标是终端自己画的光标。
IME光标是输入法候选窗口跟随的锚点。
在iTerm2等终端里输入中文时。
候选窗口出现在错误的位置。

#### 2、为什么英文不受影响

英文输入不经过IME。
所以英文用户从来没看到这个漂移。
漂移只在CJK输入时出现。

#### 3、修复

`ComposerInput`继承Textual的`Input`。
它覆写`_cursor_offset`属性。

修复返回真实的光标单元偏移。
用`_position_to_cell(self.cursor_position)`计算。
不加Textual的末尾加一。

修复的边界是明确的。

屏幕上的块光标不受影响。
块光标在render_line里单独绘制。
用character-index styling。
这个修复只纠正终端光标锚点。
IME候选窗口跟随这个锚点。

#### 4、代码量

整个组件只有十几行。
一个类。
一个属性覆写。

代码量小。
但它解决的是中文用户每天遇到的输入体验问题。

## 三、它和谁协作

上游是TUI的app.py。
app.py的composer区域使用`ComposerInput`。
用户在composer里输入消息和斜杠命令。

下游是Textual库。
`ComposerInput`继承Textual的`Input`。

它和IME协作。
修复的目的是让IME候选窗口跟随正确的光标位置。

## 四、重要性评级

评级：2分。

理由如下。

这个包只有一个组件。
代码量十几行。
解决一个单点的UI bug。

它不在任何核心路径上。
TUI本身是可选入口。
这个组件又是TUI里的一个输入框。
删除它，中文用户在终端里输入时IME候选窗口位置漂移。
功能不受损，只有体验受损。

它被引用面极小。
只有TUI的app.py引用它。

它的价值是用户体验。
CJK输入的IME跟随。
这个修复细致。
注释清楚。
但影响面是单点的。

所以给2分。
