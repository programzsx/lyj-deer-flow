# SandboxOwnershipStore档案

## 一、这个类是干什么的

这个类是ownership/base.py模块里的抽象基类。

这个类继承自abc.ABC。

这个类定义了一份跨实例所有权租约的契约。

这份契约对应#4206问题。

问题的背景要先讲清楚。

多个Gateway实例共享同一批沙箱容器。

但每个实例自己维护内存里的warm pool。

没有共享的所有权状态时会发生什么。

实例A的启动对账会采纳实例B正在使用的容器。

之后A发现容器空闲就把它销毁了。

B的活跃工具调用就报502或连接拒绝。

这个契约回答一个核心问题。

这个核心问题是"哪个实例负责回收这个容器"。

注意问题不是"哪个实例可以使用它"。

这个区分决定了整个接口的形状。

take用于acquire路径，可以从活的peer手里接过来。

claim用于回收路径，只有无人持有或已属于自己时才成功。

## 二、类的成员

这个类有一个类属性和七个方法。

supports_cross_process是类属性。

supports_cross_process声明这个存储是否能跨进程协调。

False表示peer看不到我们的租约。

False意味着只能单实例部署。

owner_id是抽象property。

owner_id返回本实例写进租约的所有者ID。

take是抽象方法。

take在acquire路径上接管sandbox_id的责任。

take可以从活的peer手里接过租约。

take只拒绝处于销毁状态的租约。

take返回True表示接管成功。

take返回False表示容器正在被销毁，不能用。

take失败时抛OwnershipBackendError。

claim是抽象方法。

claim只在容器无人持有或已属于自己时成功。

claim的for_destroy参数把租约标记成销毁进行中。

销毁标记会让并发的take被拒绝。

claim用于所有采纳和回收路径的把关。

renew是抽象方法。

renew刷新自己的租约。

renew返回RenewOutcome三值枚举。

renew故意不自动重新认领。

因为只有调用方能区分安全的重建和跨实例抢夺。

release是抽象方法。

release放弃自己在任一状态下的租约。

release对不属于我们的租约是无操作。

release绝不清理peer的活跃租约。

owner是抽象方法。

owner是只读查询，返回当前所有者ID或None。

owner用于测试和日志，不用于销毁把关。

close是非抽象方法，默认无操作。

close释放后端资源。

## 三、它和谁协作

它是ownership子包的契约中心。

MemoryOwnershipStore继承它。

MemoryOwnershipStore用进程内字典实现契约。

MemoryOwnershipStore只适合单实例部署。

RedisOwnershipStore继承它。

RedisOwnershipStore用Redis键加Lua脚本实现契约。

RedisOwnershipStore支持多实例。

AioSandboxProvider是它的最大消费方。

provider在acquire、release、destroy、对账、续期线程里调用契约方法。

契约方法全部是同步的。

原因是所有权操作由provider构造函数、后台线程、同步release驱动。

事件循环上的get()路径故意不碰这个存储。

ownership/factory.py的make_sandbox_ownership_store按配置创建具体实现。

## 四、重要性评级（1-10分+理由）

评级是8分。

理由如下。

这个类是#4206问题解决方案的接口骨架。

它定义的take/claim两分法和del:两态结构。

是整个跨实例安全体系的理论基础。

没有这份契约。

多实例部署的每个实例都会互相误杀容器。

活跃的工具调用会大面积失败。

契约下有两个实现和一个工厂。

provider依赖它的全部六个方法。

删除它等于删除跨实例所有权机制。

它的公开方法由一份契约测试套件验证。

两个实现共享同一套测试。

评级给8分。
