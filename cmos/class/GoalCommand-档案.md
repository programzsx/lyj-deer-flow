# GoalCommand档案

源码位置：`backend/packages/harness/deerflow/runtime/goal.py`

## 一、这个类是干什么的

这个类是一个解析结果数据类。

这个类承载`/goal`斜杠命令参数字符串的解析意图。

用户可以输入`/goal`命令。

参数字符串有三种可能。

空字符串。

表示查看当前活跃的目标。

`clear`、`reset`、`off`之一。

表示清除目标。

其他任何字符串。

表示把目标设置为这个文本。

这个类把三种意图表达成三个字段值。

`kind`是意图种类。

`status`、`clear`、`set`三选一。

`objective`是目标文本。

只有`set`时才有值。

这个类用`NamedTuple`定义。

NamedTuple让这个类既是一个元组。

又是一个有字段名的类型。

不可变。

可以直接解包。

这个类的docstring写明。

它是"`/goal`斜杠命令参数字符串的解析意图"。

## 二、类的成员

### （一）字段

- `kind`：意图种类。Literal类型。只能是`status`、`clear`、`set`三个值之一。
- `objective`：目标文本。字符串，默认空字符串。只有`kind`为`set`时才有意义。文本已经过trim处理。

### （二）方法

这个类没有自己定义的方法。

NamedTuple自动生成构造、解包、相等比较等方法。

这个类只承载数据。

## 三、它和谁协作

这个类和`parse_goal_command`协作。

解析函数构造并返回这个类。

解析函数是这个类的唯一生产者。

这个类和TUI界面协作。

TUI解析`/goal`命令后根据`kind`分发。

这个类和IM渠道界面协作。

IM渠道共享同一个解析函数。

三种语义在一个地方。

不会漂移。

这个类和目标设置逻辑协作。

`set`意图走`normalize_goal_objective`和`build_goal_state`。

`clear`意图走`write_thread_goal`写入None。

`status`意图返回当前目标。

## 四、重要性评级

评级：4分（满分10分）。

理由：

- 这个类是纯数据类。
- 没有任何逻辑。
- 它是`/goal`命令的三态语义契约。
- 三种语义集中在一个地方。
- TUI和IM渠道共享。
- 前端另有一个TypeScript副本。
- 语义不会漂移。
- 数据类评4到6分。
- 它只服务于斜杠命令的解析。
- 影响面小。
- 评4分。
