# SandboxClientLease档案

源码位置：backend/packages/harness/deerflow/sandbox/lease.py

## 一、这个类是干什么的

SandboxClientLease是一个沙箱客户端的租约。

SandboxClientLease代表一个有界调用者对一个沙箱客户端的进程内持有。

调用者获取租约。调用者在最后一次沙箱操作之前保持这个对象。调用者在finally里释放它。

SandboxClientLease是Gateway请求租约的非HTTP对应物。运行、subagent、通道上传这些非HTTP路径用它持有沙箱客户端。

SandboxClientLease是dataclass。声明用了slots=True。

## 二、类的成员

（一）字段

- sandbox：沙箱客户端对象。默认None。
- sandbox_id：沙箱id。
- owner_id：所有者id。默认None。释放后置None。
- provider：沙箱提供者。

（二）方法

- release：释放这个持有者。释放发生在最后一次沙箱操作完成之后。owner_id为None时直接返回。
- run_sync：在这个租约边界里跑一个阻塞的客户端操作。

## 三、它和谁协作

（一）创建者

lease.py的acquire_sandbox_client_lease函数创建SandboxClientLease。这个函数获取唯一的持有者并解析它的进程内客户端。

（二）release_on_last

release_on_last=False适用于上传同步。上传fence一个并发运行。上传自己不请求把warm沙箱park掉。

## 四、重要性评级

评级：4分。

理由：SandboxClientLease是执行租约在调用者侧的载体。它保证调用者的持有有边界。释放发生在最后操作之后。它是并发正确性的组成部分。它是数据载体加两个小方法。给4分。
