# ThreadOperationKind档案

源码位置：backend/packages/harness/deerflow/runtime/runs/schemas.py

## 一、这个类是干什么的

ThreadOperationKind是一个枚举类。

ThreadOperationKind定义持有线程独占接纳的操作种类。

一个线程同时只允许一个活跃操作。这个操作可能是一次普通运行。也可能是一次checkpoint写。ThreadOperationKind区分这些操作。

ThreadOperationKind的值有6个。

- run：普通agent运行。
- checkpoint_write：checkpoint写操作。
- artifact_write：artifact写操作。
- artifact_archive：artifact归档操作。
- branch：分支操作。
- delete：删除操作。

非run操作通过RunManager.reserve_thread_operation获得接纳。接纳是一个短命的pending行。行上记录operation_kind。

interrupt策略遇到活跃的非run操作会抛ConflictError。因为checkpoint写等操作不能被运行打断。普通运行行可以被interrupt策略取代。

## 二、类的成员

（一）枚举值

- run：run。普通agent运行。
- checkpoint_write：checkpoint_write。检查点写入。
- artifact_write：artifact_write。artifact写入。
- artifact_archive：artifact_archive。artifact归档。
- branch：branch。线程分支。
- delete：delete。线程删除。

（二）方法

ThreadOperationKind继承StrEnum。ThreadOperationKind没有自定义方法。

## 三、它和谁协作

（一）RunRecord

RunRecord的operation_kind字段类型是ThreadOperationKind。默认值是ThreadOperationKind.run。

（二）RunManager

RunManager的reserve_thread_operation接收kind参数。_admit_thread_operation按kind判断接纳类型。查询时按operation_kind等于run过滤。内部操作行不出现在普通运行列表里。

（三）存储层

MemoryRunStore和SQL存储都按operation_kind过滤普通运行。delete_by_thread只删run行。内部操作行保留。

## 四、重要性评级

评级：3分。

理由：ThreadOperationKind是线程独占接纳的词汇表。它让checkpoint写等短操作和普通运行共享同一个唯一性约束。这是并发安全的基础。但它是纯枚举。没有逻辑。所以给3分。
