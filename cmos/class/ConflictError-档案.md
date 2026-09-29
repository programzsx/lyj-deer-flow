# ConflictError档案

源码位置：backend/packages/harness/deerflow/runtime/runs/manager.py

## 一、这个类是干什么的

ConflictError是一个异常类。

ConflictError表示线程已经有活跃运行。新运行无法接纳。

触发场景是多任务策略为reject时线程已有pending或running运行。

触发场景还有interrupt和rollback策略下线程有活跃的checkpoint写操作。checkpoint写不能被打断。

触发场景还包括跨进程竞争。另一个worker持有线程内活跃运行。存储的原子接纳会抛ConflictError。唯一约束冲突也会被转换成ConflictError。

API层把ConflictError映射成HTTP 409。客户端收到409就知道线程忙。

这个异常是控制流的一部分。调用方捕获ConflictError后会执行对应的策略。例如调度服务把launching恢复到queued。

## 二、类的成员

（一）继承关系

ConflictError继承Exception。

（二）字段

ConflictError没有自定义字段。异常消息由调用方传入。

（三）方法

ConflictError没有自定义方法。

## 三、它和谁协作

（一）RunManager

RunManager的_admit_thread_operation和reserve_thread_operation抛出ConflictError。reject策略的本地检查和store路径都会抛。

（二）存储层

MemoryRunStore的create_thread_operation_atomic抛出ConflictError。SQL存储的唯一约束冲突由RunManager转换成ConflictError。

（三）调用方

Gateway服务层把ConflictError映射成409。调度服务捕获ConflictError把launching恢复到queued。

## 四、重要性评级

评级：3分。

理由：ConflictError是运行接纳并发安全的信号载体。reject策略的409语义、调度恢复策略全靠这个异常。它是跨进程竞争的统一出口。但它是空异常类。没有字段没有逻辑。所以给3分。
