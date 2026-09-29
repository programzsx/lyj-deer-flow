# _ClientScope档案

源码位置：backend/packages/harness/deerflow/skills/skillscan/orchestrator.py

## 一、这个类是干什么的

_ClientScope是客户端外呼分析的词法作用域状态。

分析要追踪客户端句柄。追踪按作用域进行。每个词法作用域有一份状态。状态里记录名字到构造器的映射。状态里还记录导入别名。

_ClientScope是dataclass。

## 二、类的成员

（一）字段

- handles：名字到构造器的映射。映射记录这个作用域里的客户端句柄。
- aliases：名字到目标的映射。映射记录导入别名。
- unstable_aliases：不稳定别名集。frozenset。默认空。

（二）方法

- copy_without：复制作用域。指定的名字不进副本。复制按条目数计费。副本用于分支语句体。分支体的分析从隔离的入口状态开始。这样if True:不是万能绕过。
- aliases_only：只保留别名的副本。handles清空。不稳定别名也剔除。副本用于嵌套作用域。嵌套作用域只继承稳定的导入别名。嵌套作用域不继承客户端句柄。

## 三、它和谁协作

（一）分析状态

_ClientAnalysis给复制计费。每次复制按条目数扣预算。

（二）遍历函数

_walk_client_scope、_walk_client_statements、_walk_client_branching、_walk_client_nested_scope都在作用域上操作。_rebind_client_scope更新句柄。_drop_client_bindings清除歧义绑定。歧义绑定被清除而不是合并。

## 四、重要性评级

评级：4分。

理由：_ClientScope是外呼信号的作用域追踪核心。句柄只在本作用域有效。嵌套作用域只继承稳定别名。歧义绑定被清除。复制按预算计费。这些设计让信号保持高置信且有界。给4分。
