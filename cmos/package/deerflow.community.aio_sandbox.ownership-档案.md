# deerflow.community.aio_sandbox.ownership档案

本文档解读deerflow.community.aio_sandbox.ownership这个子包。

本文档基于对该包目录下全部代码文件的实际阅读。

本文档的读者是想理解沙箱跨实例所有权机制的开发者。

## 一、这个包是干什么的

这个子包是AIO沙箱的跨实例所有权租约实现。

这个子包对应代码里的issue #4206。

问题的背景如下。

多个Gateway实例共享沙箱容器。

每个实例自己维护一个内存预热池。

没有共享的所有权状态时。

一个实例的启动调和会收编另一个实例正在用的容器。

然后空闲回收会把它销毁。

被销毁的容器让工具调用报502或连接拒绝。

这个子包用租约回答一个问题。

这个问题是"哪个实例负责回收这个容器"。

注意不是"哪个实例可以用它"。

这个区分决定了整个接口的设计。

这个子包就是这些租约的存储和管理。

## 二、包里的主要成员

### 1、SandboxOwnershipStore

SandboxOwnershipStore是所有权存储的抽象基类。

这个类定义了六个方法。

take在获取路径上接管沙箱的责任。

take会从活着的对等实例手里接管。

这是因为一个线程的连续轮次可能路由到不同实例。

拒绝接管会让线程卡到租约过期。

take只拒绝正在被销毁的容器。

claim只在容器无主或已经是自己的时候成功。

claim是独占的。

claim挡住所有收编和回收路径。

claim对等实例独占。

claim不排除自己进程内的重复claim。

claim带for_destroy参数。

for_destroy把租约标记为"销毁进行中"。

标记之后并发的take会被拒绝。

这关闭了销毁和重新获取之间的窗口。

renew刷新本实例的租约。

renew故意不自己重新获取。

因为只有调用方能区分安全的重建和跨实例的抢夺。

release丢弃本实例的租约。

release对不属于自己的租约是空操作。

release不会清掉对等实例的活租约。

owner只读地返回当前租约的持有者。

owner用于检查和日志。

owner不用于拦截销毁。

owner读到的值返回的一刻就是旧的。

claim成功才能持续挡住对等实例。

close释放后端资源。

这个类还有一个重要约定。

所有方法都是同步的。

所有权由Provider构造函数、后台线程、同步release路径驱动。

在事件循环上的沙箱工具路径故意不碰这个存储。

所有方法在后端故障时抛OwnershipBackendError。

调用方必须fail closed。

所有权发布不出来的沙箱不能交给代理。

所有权不能证明空闲的容器不能销毁。

返回False表示"确定不是我们的"。

抛异常表示"不知道"。

### 2、RenewOutcome

RenewOutcome是一个枚举。

RenewOutcome说明续租为什么成功或失败。

RENEWED表示租约还是我们的，TTL已刷新。

LAPSED表示租约不存在了。

LAPSED意味着没人拿走它。

LAPSED之后重新claim是安全的。

LOST表示租约被对等实例持有，或者正在销毁。

LOST之后不能重新拿。

LAPSED和LOST不能合并成一个假值。

合并是错误的。

Redis重启时，只有LAPSED能保住全部活沙箱。

### 3、OwnershipBackendError

OwnershipBackendError表示所有权后端无法回答。

OwnershipBackendError和"确定不是我们的"是两回事。

OwnershipBackendError意味着所有权状态未知。

未知状态下调用方必须fail closed。

### 4、MemoryOwnershipStore

MemoryOwnershipStore是进程内的所有权存储。

MemoryOwnershipStore只用于单实例部署。

它的supports_cross_process是False。

它里面的东西别的进程看不见。

多实例部署必须用redis存储。

Provider启动时会警告。

MemoryOwnershipStore不是存根实现。

TTL和两种租约状态都是真实现了的。

一套契约测试能同时测两个后端。

MemoryOwnershipStore用进程内锁串行化所有操作。

租约存在一个字典里。

键是sandbox_id。

值是_Lease数据类。

_Lease记录持有者、过期时间、是否在销毁。

### 5、RedisOwnershipStore

RedisOwnershipStore是Redis支持的多实例所有权存储。

RedisOwnershipStore的supports_cross_process是True。

每个沙箱对应一个Redis键。

键的值编码持有者和租约状态。

状态前缀有两种。

own:表示"我负责这个容器"。

del:表示"我正在销毁它"。

租约有TTL。

持有实例会刷新TTL。

状态前缀让销毁窗口安全。

takeover会拒绝del:前缀的租约。

所以容器不会在claim和停止之间被重新拿走。

所有变更都走Lua脚本。

Lua脚本让读和写不能被对等实例穿插。

只用SET NX是不够的。

SET NX在自己已持有的键上会失败。

Python里先GET再SET会重新打开竞态窗口。

这个存储用同步Redis客户端。

这个存储由Provider构造和后台线程驱动。

这个存储从不在事件循环上运行。

redis.asyncio在这里是错误的选择。

每个往返都有5秒的socket超时。

超时让卡住的Redis不能拖死调用方。

销毁心跳的退出路径尤其依赖这个。

### 6、factory.py的工厂函数

generate_owner_id生成本实例的唯一ID。

格式是主机名加随机hex。

ID是每实例的，不是每主机的。

一台主机上的两个Gateway进程要能区分各自的租约。

resolve_ownership_config补全省略的ownership配置。

已经把stream bridge指向Redis的部署就是多实例部署。

这种部署会被推断为redis所有权存储。

静默回退到内存存储会让#4206重新出现。

compute_lease_ttl计算租约的TTL。

TTL从续期间隔推导。

TTL不从sandbox.idle_timeout推导。

把存活和空闲回收耦合是错误的。

idle_timeout为0时空闲检查不会启动。

这种配置下租约会失效。

make_sandbox_ownership_store根据配置构建存储。

调用方拥有返回的存储。

调用方必须close它。

redis分支是懒导入的。

memory-only的安装永远不导入redis包。

## 三、它和谁协作

这个子包依赖的外部组件如下。

- Redis，可选，用于redis存储
- deerflow.config.sandbox_config，读取SandboxOwnershipConfig

这个子包被谁调用。

AioSandboxProvider在构造时创建所有权存储。

AioSandboxProvider用它发布、claim、续期、释放租约。

e2b_sandbox的Provider也复用这个子包。

e2b用它做多实例所有权协调。

e2b的capacity子包还复用它的resolve_ownership_redis_url函数。

__init__.py里故意不导入RedisOwnershipStore。

懒导入避免把每个AIO安装都绑到redis包上。

## 四、重要性评级

评级：8分。

理由如下。

多实例部署是生产环境的常见形态。

没有这个子包，多实例部署会互相破坏对方的沙箱。

这个子包是#4206这个跨实例安全问题的核心修复。

契约设计非常严谨。

两种租约状态、三个续租结果、fail closed约定都经过了仔细推敲。

Redis实现用Lua脚本保证了原子性。

扣2分是因为单实例部署用不到它。

内存存储虽然实现了，但单实例下很多保护是多余的。

它是被aio_sandbox和e2b复用的基础设施，本身不直接面对代理。
