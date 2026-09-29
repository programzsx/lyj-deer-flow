# _ClaimOwner-档案

## 一、这个类是干什么的

_ClaimOwner是app/mcp_tasks/service.py里的内部数据类。

它持有claim和handoff任务。

它支撑批处理的claim生命周期。

_BatchState-档案.md已覆盖它和常量。

这个文档补充claim生命周期。

位于backend/app/mcp_tasks/service.py。

## 二、类的成员（字段，各自做什么）

### 1、字段

claim_task是claim任务。

handoff_task是handoff任务。

### 2、claim生命周期

claim_with_cancellation_release包装claim。

取消时释放claim。

phase是poll或cancel。

poll claim失败时释放poll。

handoff是claim到批执行的移交。

### 3、lease身份

lease_owner是{hostname}:{uuid}。

claim_due_tasks带lease_owner和lease_seconds。

租期过期后任务被其他实例恢复。

## 三、它和谁协作

- McpTaskService的run_once使用它。
- McpTaskRepository的claim_due_tasks。
- 批执行移交时使用。

## 四、重要性评级

评级是3分。

理由如下。

这个类是claim生命周期的载体。

claim_task加handoff_task。

取消时释放claim。lease身份保证恢复。

扣掉7分。

扣分原因是它是内部状态类。
