# _FileSnapshot档案

源码位置：backend/packages/harness/deerflow/extensions/manager.py

## 一、这个类是干什么的

_FileSnapshot是一个文件快照。

ExtensionManager的安装和卸载是事务。事务会修改pyproject.toml和uv.lock这些文件。失败时要把文件恢复成事务开始前的样子。_FileSnapshot就是这个恢复机制的载体。

_FileSnapshot捕获一个文件的路径和内容。restore方法恢复内容。内容为None表示文件原本不存在。restore时删除文件。

_FileSnapshot是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- path：文件路径。
- content：文件内容字节。None表示文件原本不存在。

（二）方法

- capture：类方法。捕获一个文件的快照。文件不存在时content为None。
- restore：恢复文件。content为None时删除文件。否则写字节内容。

## 三、它和谁协作

（一）使用者

ExtensionManager的_install和_remove用_FileSnapshot捕获pyproject.toml和uv.lock。失败时调用restore恢复。

_remove还捕获config_path的快照。config恢复冲突时保留外部编辑并报错。

## 四、重要性评级

评级：4分。

理由：_FileSnapshot是安装事务回滚的基础设施。没有它，失败的事务会留下半改状态的依赖文件。半改状态的依赖文件会让环境无法同步。它是个简单的数据类。但作用是保护性的。给4分。
