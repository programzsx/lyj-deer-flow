# ComposerInput档案

源码位置：backend/packages/harness/deerflow/tui/widgets/composer.py

## 一、这个类是干什么的

ComposerInput是TUI底部的输入框组件。

ComposerInput继承自Textual的Input类。

ComposerInput的存在是为了修一个中文输入的光标bug。

这个bug的具体情况是这样的。Textual的Input._cursor_offset在光标位于文本末尾时会无条件加1。加了1之后，在双宽字符（CJK字符）后面会越界一格。越界的后果是硬件光标或IME光标错位。用户在iTerm2这类终端里打中文时会看到光标漂移。IME候选框会跟着错位的光标走。

英文输入不会触发这个bug。原因是英文不走IME。所以只有CJK输入会出现漂移。

ComposerInput重写了_cursor_offset属性。重写后返回真实的光标单元格偏移。不再加末尾的+1。

屏幕上的方块光标不受这个bug影响。方块光标在render_line里用字符索引方式单独绘制。这个修复只影响终端光标锚点。

## 二、类的成员

（一）重写的属性

- _cursor_offset：光标偏移。重写为返回_position_to_cell(cursor_position)。这是真实的单元格偏移。

## 三、它和谁协作

（一）父类

ComposerInput继承Textual的Input。ComposerInput只改一个属性，其余行为不变。

（二）使用者

app.py的compose方法创建ComposerInput。ComposerInput是TUI唯一的输入组件。id是composer。

## 四、重要性评级

评级：3分。

理由：ComposerInput的代码量极小。只有几行。但它是中文用户的核心体验修复。中文用户打字光标错位是显眼的bug。没有这个类，TUI对中文用户基本不可用。给3分。
