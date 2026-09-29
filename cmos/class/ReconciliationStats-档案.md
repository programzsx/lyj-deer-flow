# ReconciliationStats-档案

## 一、这个类是干什么的

ReconciliationStats是community/e2b_sandbox/e2b_sandbox_provider.py里的数据类。

它是一次有界reconciliation的结果计数。

也适合metrics和日志。

这个类位于backend/packages/harness/deerflow/community/e2b_sandbox/e2b_sandbox_provider.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

discovered是发现的sandbox数。

adopted是采纳的sandbox数。

duplicates是重复数。

deferred是推迟数。

killed是杀掉的sandbox数。

dead是已死的sandbox数。

budget_exhausted是budget是否耗尽。

### 2、reconciliation的含义

E2B是远端sandbox。

多gateway部署时sandbox通过metadata key发现。

reconciliation扫描远端sandbox。采纳、去重、推迟、杀掉或标记死亡。

## 三、它和谁协作

- E2BSandboxProvider的reconciliation pass产生它。
- metrics和日志消费它。

## 四、重要性评级

评级是4分。

理由如下。

这个类是reconciliation结果的计数载体。

七个计数。discovered、adopted、duplicates、deferred、killed、dead、budget_exhausted。

适合metrics和日志。

扣掉6分。

扣分原因是它是纯计数载体。逻辑在provider里。
