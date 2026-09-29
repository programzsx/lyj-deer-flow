# app.gateway.checkpoint_retention-档案

源码路径是backend/app/gateway/checkpoint_retention.py。

## 一、这个模块是干什么的

checkpoint_retention.py是线程级检查点保留。

检查点会越攒越多。

检查点多了会占用大量存储。

这个模块按契约删除安全的检查点。

契约由docs/checkpoint-retention-contract.md和测试套定义。

这个模块有519行。

## 二、模块里的主要成员

### 1、两种删除形状

第一种是纯时长的尾部叶子。

运行结束后会追加只有元数据的检查点。

没有后续运行从它分叉，它就不是任何人的祖先。

这种检查点可以删除。

第二种是叶子兄弟分支，这是可选删除。

从旧回合分叉又没有子节点的检查点可以删除。

可选删除是因为被淘汰的分支还可能是恢复目标。

### 2、永不删除的内容

恢复头部祖先链上的检查点永不删除。

显式保护的检查点ID永不删除。

还拥有writes行的检查点永不删除。

RetentionPolicy.protect_checkpoint_ids是保护逃生口。

### 3、enforce_thread_retention

enforce_thread_retention是入口。

输入是线程ID和保留策略。

输出是RetentionReport报告。

删除在存储层执行。

### 4、内部结构

_Node是血缘图的节点。

模块先构建血缘图，再标记叶子，再删除。

删除后还要清理不可达的blob。

_blob清理避免存储残留。

_ensure_supported_saver检查存储器类型。

## 三、它和谁协作

上游是threads.py的删除流程和app.py的清扫。

下游是LangGraph检查点存储。

契约测试在tests/test_checkpoint_retention_contract.py。

## 重要性评级

评级是6分。

理由如下。

检查点存储会无限增长。

保留清扫控制存储成本。

删除安全性靠契约测试钉死。

只做被证明安全的两种删除形状。

永不删除的保护集合防止误删。

但它是后台清理功能。

不参与运行路径。

所以评级是6分。
