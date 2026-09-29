# EditReplayVisibility档案

源码位置：backend/packages/harness/deerflow/runtime/runs/store/base.py

## 一、这个类是干什么的

EditReplayVisibility是编辑重跑的运行可见性规则集合。

EditReplayVisibility保存两组运行ID。这两组ID决定编辑重跑场景下哪些运行对客户端可见。

背景是这样的。编辑重跑会创建一个attempt运行。attempt运行取代一个source运行。取代成功后source运行应该对客户端隐藏。取代失败则attempt运行本身隐藏。

EditReplayVisibility由RunManager.list_edit_replay_visibility计算。计算逻辑在_compute_edit_replay_visibility。

存储层用这个类型吗。不用。这个类型定义在store/base.py是因为它是runs模块的共享词汇。它描述的是运行记录查询的结果语义。

## 二、类的成员

（一）字段

- `hidden_source_run_ids`：应该被隐藏的source运行ID集合。source运行被一个pending、running或success的attempt取代时隐藏。
- `hidden_attempt_run_ids`：应该被隐藏的attempt运行ID集合。attempt以error、timeout或interrupted结束时attempt自己隐藏。

（二）方法

EditReplayVisibility是frozen dataclass。EditReplayVisibility没有自定义方法。

## 三、它和谁协作

（一）RunManager

RunManager的_compute_edit_replay_visibility构建这个类型。list_edit_replay_visibility返回它。

（二）编辑重跑路径

worker.py的编辑重跑路径消费这个规则。决定恢复哪个checkpoint。发布哪个values快照。

（三）客户端

客户端按这两组ID过滤运行列表。被取代的source和失败的attempt不显示。

## 四、重要性评级

评级：3分。

理由：EditReplayVisibility承载了编辑重跑的可见性语义。它让客户端在重跑场景下看到一致的运行列表。不会同时看到被取代的消息。但它是个小的两字段dataclass。作用面限于编辑重跑场景。所以给3分。
