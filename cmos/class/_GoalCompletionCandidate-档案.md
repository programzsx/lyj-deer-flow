# _GoalCompletionCandidate档案

源码位置：backend/packages/harness/deerflow/runtime/runs/worker.py

## 一、这个类是干什么的

_GoalCompletionCandidate是目标完成评估的候选记录。

_GoalCompletionCandidate保存两个内容。一个是待评估的GoalState目标。一个是评估时的会话签名。

取消已完成目标时需要先验证目标没有变。会话没有变。验证靠比较。候选记录就是比较的基准。

_clear_completed_goal函数接收一个候选。验证checkpoint里的目标等于候选的目标。验证可见会话签名等于候选的签名。两个都相等才清除目标。不相等就跳过。因为目标或会话已经被别的路径改了。

类名带下划线前缀。这是worker.py的内部类。

## 二、类的成员

（一）字段

- `goal`：待评估的目标。类型是GoalState。清除前必须和checkpoint里的目标完全相等。
- `conversation_signature`：评估时的可见会话签名。清除前必须和当前可见会话签名相等。

（二）方法

_GoalCompletionCandidate是frozen dataclass。_GoalCompletionCandidate没有自定义方法。

## 三、它和谁协作

（一）_clear_completed_goal

worker.py的_clear_completed_goal函数消费候选。比较目标和会话签名。都相等才清除目标。清除用durable的checkpoint_write接纳。

（二）目标评估路径

worker的目标完成评估路径构建候选。候选捕获评估时刻的目标和会话状态。捕获和清除之间可能有别的写入。候选就是这段时间的验证基准。

（三）GoalState

GoalState是目标状态类型。候选的goal字段引用它。

## 四、重要性评级

评级：3分。

理由：_GoalCompletionCandidate是目标完成清除的验证基准。它防止清除一个已经被别的路径改掉的目标。full等值比较是刻意的。没有它，目标清除可能覆盖并发更新。但它是个小的两字段dataclass。作用面窄。所以给3分。
