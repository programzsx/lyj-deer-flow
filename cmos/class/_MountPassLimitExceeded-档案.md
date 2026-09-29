# _MountPassLimitExceeded-档案

## 一、这个类是干什么的

_MountPassLimitExceeded是community/e2b_sandbox/e2b_sandbox_provider.py里的内部异常类。

它继承Exception。

它停止当前mount upload pass在聚合资源限制处。

这个类位于backend/packages/harness/deerflow/community/e2b_sandbox/e2b_sandbox_provider.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、继承关系

_MountPassLimitExceeded继承Exception。

### 2、抛出场景

_MountUploadBudget.check_deadline在过期时抛它。

### 3、语义

它是聚合资源限制的停止信号。

deadline、文件数或字节budget到达时pass停止。

pass停止产生MountUploadResult。truncated为True。

单个mount失败不抛它。那些被记录但不截断。

## 三、它和谁协作

- _MountUploadBudget的check_deadline抛它。
- E2BSandbox的mount upload pass捕获它并产生MountUploadResult。

## 四、重要性评级

评级是3分。

理由如下。

这个类是mount upload pass的停止信号。

聚合限制和单个失败分开。

无字段。消息带原因。

扣掉7分。

扣分原因是它是内部控制流异常类。
