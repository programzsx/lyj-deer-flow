# _Node档案

来源文件：`backend/app/gateway/checkpoint_retention.py`

## 一、这个类是干什么的

这个类是检查点保留模块的内部辅助类。

这个类代表检查点 lineage 图里的一个节点。

一个检查点对应一个`_Node`对象。

这个类把LangGraph检查点元组里做删除决策需要的字段抽出来。

抽出来的字段包括命名空间、检查点id、父节点信息、是否只含时长元数据、元数据来源、是否携带运行时长表、以及channel版本集合。

保留策略拿着这些字段做四件事。

第一件事是构建父子关系图。

第二件事是找出每个命名空间的最新恢复头。

第三件事是沿父链标记受保护节点。

第四件事是判断哪些叶子节点可以删。

## 二、类的成员

这个类是普通dataclass，不是冻结的。

这个类有八个字段。

### 1、字段ns

`ns`字段是检查点命名空间字符串。

根命名空间是空字符串。

持久子图有自己的子命名空间。

### 2、字段cp_id

`cp_id`字段是检查点id。

LangGraph的检查点id是按时间排序的uuid7。

### 3、字段parent_ns

`parent_ns`字段是父检查点的命名空间。

没有父节点时`parent_ns`为`None`。

### 4、字段parent_id

`parent_id`字段是父检查点的id。

没有父节点时`parent_id`为`None`。

### 5、字段duration_only

`duration_only`字段是布尔值。

`duration_only`为真表示这个检查点只记录运行时长，不代表可寻址的对话状态。

`duration_only`为真的叶子节点是默认可删除的形状。

### 6、字段metadata_source

`metadata_source`字段是元数据里的`source`值。

`metadata_source`用于Postgres后端的时长叶子二次判定。

### 7、字段carries_run_durations

`carries_run_durations`字段是布尔值。

`carries_run_durations`为真表示元数据携带非空的`run_durations`映射。

### 8、字段versions

`versions`字段是frozenset集合。

`versions`字段存放检查点的channel版本值集合。

`versions`字段有两个用途。

一个用途是判定Postgres上没有标记的时长叶子。

另一个用途是计算删除后哪些blob版本成了孤儿。

## 三、它和谁协作

这个类由`enforce_thread_retention()`函数在扫描检查点时批量创建。

这个类被`_mark_duration_leaves_without_the_marker()`函数消费。

这个类的父子信息被用于构建`children`映射和受保护链。

这个类只在`checkpoint_retention.py`模块内部使用。

这个类依赖`checkpoint_lineage.py`的`is_duration_only_checkpoint()`做判定。

## 四、重要性评级

评级：5分。

理由：这个类是整个检查点保留算法的核心数据结构。删除决策完全建立在这个类携带的字段上。删错检查点会破坏线程历史，所以这个类的字段质量直接决定安全性。但这个类只服务一个模块的一条功能路径。这个类没有对外行为。所以这个类是模块内核心、模块外无感知的内部角色。
