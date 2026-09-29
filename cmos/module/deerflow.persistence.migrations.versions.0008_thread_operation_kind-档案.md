# 0008_thread_operation_kind档案

## 一、这个迁移是干什么的

给`runs`表加`operation_kind`列。区分一个运行是普通运行还是别的操作类型。比如checkpoint write。

## 二、做了什么schema变更

- 给`runs`加`operation_kind`列。String(32)。NOT NULL。服务器默认值`'run'`。

## 三、涉及哪些表

只涉及`runs`表。

## 四、重要细节

服务器默认值'run'让已有行在ALTER时拿到默认值。不触发NOT NULL违规。这个字段和thread_operation_kind的活跃唯一约束配套。手动压缩和checkpoint写入用别的operation_kind。

## 五、重要性评级

评级是6分。

理由。operation_kind区分运行和checkpoint写入。这是活跃线程唯一约束的一部分。防止运行和checkpoint写入互相竞争。
