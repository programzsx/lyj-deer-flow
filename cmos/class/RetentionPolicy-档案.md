# RetentionPolicy档案

来源文件：`backend/app/gateway/checkpoint_retention.py`

## 一、这个类是干什么的

这个类是检查点保留策略。

检查点保留是清理旧检查点的功能。

清理是破坏性操作，删错了会破坏线程历史。

这个类声明"这一次运行允许删什么"。

默认策略只修剪契约证明无条件安全的形状。

可选开关可以放开更激进的清理。

这个类是冻结dataclass，保证策略一旦传入就不会被中途修改。

保留服务`enforce_thread_retention()`拿这个类做删除决策。

## 二、类的成员

这个类是`@dataclass(frozen=True)`装饰的冻结数据类。

这个类有五个字段。

### 1、字段prune_trailing_duration_leaves

`prune_trailing_duration_leaves`是布尔值，默认真。

这个开关控制是否清理"尾部只含时长元数据的叶子检查点"。

这类检查点是运行结束后追加的元数据检查点，不是任何人的祖先。

这是契约证明安全的形状E1。

### 2、字段prune_leaf_sibling_branches

`prune_leaf_sibling_branches`是布尔值，默认假。

这个开关控制是否清理"从旧回合分叉出来且没有子节点的兄弟分支叶子"。

这是可选开关。

原因是被取代的line上的检查点可能还是客户端持有的显式恢复目标。

这是契约场景E2。

### 3、字段protect_checkpoint_ids

`protect_checkpoint_ids`是frozenset，默认空集。

集合里的检查点id绝对不删。

这是客户端持有显式恢复目标时的逃生舱。

### 4、字段strict_pending_write_guard

`strict_pending_write_guard`是布尔值，默认真。

这个开关控制是否拒绝删除仍然拥有writes行的检查点。

未提交的writes是保留状态，不是垃圾。

### 5、字段max_delete_per_run

`max_delete_per_run`是单次运行的最大删除数，默认`None`表示不设上限。

负数会被直接拒绝。

## 三、它和谁协作

这个类由`enforce_thread_retention()`消费。

调用方构造这个类并传入保留服务。

这个类的判定依赖`checkpoint_lineage.py`的时长叶子判定。

这个类没有任何方法，只是策略声明。

## 四、重要性评级

评级：6分。

理由：这个类是破坏性清理操作的安全边界。检查点删除的每一条安全约束都声明在这个类里。负数上限会在读取任何行之前被拒绝，避免负索引放大删除批次。默认策略刻意保守，只清理契约证明安全的形状。所以这个类是保留功能的核心决策输入。
