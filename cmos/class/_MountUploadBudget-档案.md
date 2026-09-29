# _MountUploadBudget-档案

## 一、这个类是干什么的

_MountUploadBudget是community/e2b_sandbox/e2b_sandbox_provider.py里的数据类。

它是mount upload pass的资源预算。

字段是deadline加attempted和completed计数。

这个类位于backend/packages/harness/deerflow/community/e2b_sandbox/e2b_sandbox_provider.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

deadline是monotonic截止时间。

deadline_seconds是配置的截止秒数。

attempted_bytes和attempted_files是尝试的字节数和文件数。

completed_bytes和completed_files是完成的字节数和文件数。

### 2、expired属性

time.monotonic()大于等于deadline时为True。

### 3、check_deadline方法

过期时抛_MountPassLimitExceeded。

消息带_mont_deadline_reason。

## 三、它和谁协作

- E2BSandbox的mount upload pass用它记账。
- _MountPassLimitExceeded是它的停止信号。
- MountUploadResult从它的计数产生。

## 四、重要性评级

评级是3分。

理由如下。

这个类是upload pass的资源预算。

deadline加计数。

check_deadline聚合限制。

扣掉7分。

扣分原因是它是内部记账数据类。
