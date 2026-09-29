# Command档案

源码位置：backend/packages/harness/deerflow/tui/command_registry.py

## 一、这个类是干什么的

Command是一个命令条目类。

TUI有一个斜杠命令系统。每条命令用一个Command对象表示。

Command代表两类命令中的一类。一类是TUI自带的内置命令。比如/help、/model、/threads。另一类是技能命令。每个启用的技能对应一条/<技能名>命令。

Command是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- name：命令名。不带开头的斜杠。
- description：命令描述。描述显示在帮助和命令面板里。
- category：命令类别。取值是builtin、skill二选一。默认是builtin。

（二）模块级常量

command_registry.py里有一个BUILTIN_COMMANDS元组。这个元组装着全部18条内置命令。/help的文本从这个元组派生。派生的好处是帮助文本和注册表不会失同步。

## 三、它和谁协作

（一）构建者

build_registry函数构建Command列表。build_registry合并内置命令和技能命令。

（二）消费者

app.py的命令面板用Command列表显示候选。filter_commands函数按查询词过滤和排序Command列表。

## 四、重要性评级

评级：2分。

理由：Command只是一个三字段的数据条目。命令系统的逻辑在build_registry和resolve函数里。但Command是命令面板展示的基本单元。给2分。
