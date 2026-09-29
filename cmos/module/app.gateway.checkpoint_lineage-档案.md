# app.gateway.checkpoint_lineage-档案

源码路径是backend/app/gateway/checkpoint_lineage.py。

## 一、这个模块是干什么的

checkpoint_lineage.py是检查点血缘的共享辅助。

检查点是对话在某一时刻的快照。

线程的多个检查点构成一条血缘链。

分支线程要回放检查点。

回放要先在血缘链上找到正确的检查点。

这个模块负责安全地解析血缘。

这个模块只有183行。

## 二、模块里的主要成员

### 1、异常类

CheckpointLineageError是血缘错误基类。

CheckpointParentMissingError表示旧检查点没有父链接。

CheckpointLineageIntegrityError表示血缘记录存在但不安全。

错误都继承RuntimeError。

### 2、检查点属性

checkpoint_messages读检查点消息。

checkpoint_configurable读检查点配置。

checkpoint_metadata读检查点元数据。

is_duration_only_checkpoint判断是否纯时长检查点。

has_pending_tasks判断是否有未完成任务。

### 3、血缘查找

find_checkpoint_before_message找某条消息之前的检查点。

find_checkpoint_before_message_chronologically按时间顺序找。

查找会校验血缘完整性。

血缘不安全时抛异常。

异常保证不回放到错误的状态。

## 三、它和谁协作

上游是threads.py的分支端点。

分支回放检查点时调用血缘查找。

下游是LangGraph检查点存储。

检查点数据由checkpointer持有。

保留清扫也判断时长检查点。

## 重要性评级

评级是6分。

理由如下。

分支线程是重要功能。

分支的正确性靠血缘解析。

血缘不安全时抛异常，不做错误回放。

这个设计直接保护用户数据。

但这个模块是纯辅助逻辑。

体量小，无HTTP端点。

只有分支和保留清扫用它。

所以评级是6分。
