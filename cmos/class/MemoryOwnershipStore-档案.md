# MemoryOwnershipStore档案

## 一、这个类是干什么的

这个类是ownership/memory.py模块里的所有权存储实现。

这个类继承自SandboxOwnershipStore。

这个类把所有权租约保存在本进程内存里。

这个类的适用范围很窄。

这个类只在单实例部署下是正确的。

原因在模块docstring里讲得直白。

进程内存里的东西别的进程看不见。

如果两个Gateway实例都用这个类。

一个实例会看到所有容器都是"无人持有"。

然后采纳并销毁另一个实例正在用的容器。

这就是#4206在单实例假设被打破时的复发。

所以这个类的supports_cross_process是False。

provider启动时检测到False会打警告。

多实例部署必须换用RedisOwnershipStore。

这个类还有一个设计要点。

TTL和两种租约状态是真的实现了的。

不是留空的桩。

这样一份契约测试套件可以同时测两个实现。

过期行为在两个存储下表现一致。

## 二、类的成员

构造函数接收三个关键字参数。

owner_id是本实例的所有者ID。

ttl_seconds是租约存活秒数。

time_source是时间来源函数。

time_source默认是time.monotonic。

time_source可注入方便测试。

owner_id是property，返回本实例所有者ID。

take方法在acquire路径上接管租约。

take读取租约的destroying标志。

只有销毁中的租约会被拒绝。

活的peer租约会被直接覆盖接管。

claim方法只在无人持有或已属于自己时成功。

claim的for_destroy参数设置销毁标记。

claim有一条特殊规则。

非销毁的claim不能撤销自己已设置的销毁标记。

因为停止操作已经在路上，无法收回。

renew方法刷新自己的租约。

租约不存在返回RenewOutcome.LAPSED。

租约是别人的或销毁中返回RenewOutcome.LOST。

自己的正常租约刷新并返回RENEWED。

release方法放弃自己的租约。

release只删owner_id等于自己的租约。

owner方法只读查询当前所有者。

close方法清空全部租约字典。

这个类还有三个内部辅助。

_live_lease_locked取出未过期的租约，过期即删除。

_write_locked写入新租约。

锁是threading.Lock。

acquire路径、空闲检查线程、续期线程都会碰字典。

所以字典访问全部在锁内。

## 三、它和谁协作

它继承自SandboxOwnershipStore。

它的数据载体是_Lease冻结数据类。

字典的值就是_Lease实例。

它由ownership/factory.py的make_sandbox_ownership_store创建。

配置里sandbox.ownership.type为memory时选它。

AioSandboxProvider在启动时通过工厂拿到它。

provider调用它的全部六个契约方法。

provider的_publish_ownership调take。

_claim_ownership调claim。

_refresh_ownership调renew。

_release_ownership调release。

_adoptable_after_grace调owner。

shutdown调close。

它和RedisOwnershipStore是兄弟实现。

两者实现同一份契约。

## 四、重要性评级（1-10分+理由）

评级是6分。

理由如下。

这个类是单实例部署的默认所有权存储。

大多数开发环境和小型部署都用它。

它完整实现了两态租约和TTL。

让契约测试可以在无Redis的环境跑通。

CI里跑的就是memory这一层。

如果删掉这个类。

单实例部署就得依赖Redis。

开发门槛会提高。

或者部署退化回无所有权的旧状态。

#4206会重新出现。

它的实现是线程安全的。

三个线程并发访问都靠_lock保护。

影响范围是单实例场景。

评级给6分。
