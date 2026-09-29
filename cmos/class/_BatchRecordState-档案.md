# _BatchRecordState-档案

## 一、这个类是干什么的

_BatchRecordState是app/mcp_tasks/service.py里的内部数据类。

它是McpTaskService批处理的一条记录的运行状态。

它和_BatchState、_ClaimOwner一起支撑批处理。

_BatchState-档案.md已覆盖三个类和常量。

这个文档补充记录记录状态。

位于backend/app/mcp_tasks/service.py。

## 二、类的成员（字段，各自做什么）

### 1、字段

record是批记录字典。来自repository的claim。

ordinary_release_task是ordinary batch的释放task。

ordinary batch完成时的释放观察。

release task被跟踪和保留。

cancellation drain超时5秒。

### 2、批释放生命周期

ordinary batch完成时释放。

释放task被观察和跟踪。

保留列表防止释放task被垃圾回收。

取消时排空释放task。超时5秒。

### 3、claim owner

lease_owner是{hostname}:{uuid}。

每个Gateway实例唯一的claim身份。

lease_seconds界定claim租期。

lease过期后任务可以被其他实例恢复。

## 三、它和谁协作

- McpTaskService管理批记录状态。
- McpTaskRepository的claim_due_tasks返回record。
- 释放task被observation跟踪。

## 四、重要性评级

评级是3分。

理由如下。

这个类是批记录状态的载体。

record加release task。

释放生命周期和取消排空。

它支撑批处理的正确性。

扣掉7分。

扣分原因是它是内部状态类。与_BatchState合组的档案已覆盖。
