# 模块档案：deerflow.community.e2b_sandbox.capacity.redis

## 一、这个模块是干什么的

这个模块实现部署级的E2B容量账本。
底层是一个Redis Hash。
先解释为什么需要它。
E2B云沙箱要花钱。
多个Gateway进程共用一个E2B账号。
每个进程自己限制容量是不够的。
必须有部署级的共享上限。
这个模块用Redis Hash做共享账本。
多个Gateway通过它协调沙箱总量。
账本的操作全部在一个Lua脚本里执行。
Lua脚本在Redis里原子执行。
所以没有竞态。
账本里记录这些内容。
meta:state记录状态。
meta:hard_limit记录配置的硬上限。
meta:revision记录修订号。
r:开头的字段是预留记录。
s:开头的字段是已存在的沙箱记录。

## 二、模块里的主要成员

（1）_LEDGER_SCRIPT
这是一段Lua脚本。
它实现全部账本操作。
每个操作在Redis端原子执行。
操作有五种。
revision操作读当前修订号。
reserve操作申请一个容量槽。
已预留的直接返回GRANTED。
达到硬上限返回FULL。
账本还没就绪返回NOT_READY。
成功预留写入r:字段并递增修订号。
track操作把预留换成已存在记录。
release操作删除已存在记录。
reconcile操作做远程对账。
带期望修订号检查。
修订号不匹配返回STALE。
完整对账时标记和清理失联的沙箱。
脚本里有个关键常量META_FIELD_COUNT。
它记录initialize写的meta字段数。
活跃条目数按HLEN减去这个常量算。
加一个meta字段不改这个常量。
账本就会多算用量。
提前拒绝一次预留。
测试用例把这个常量和实际输出钉在一起。

（2）ReserveStatus枚举
预留结果有三种。
GRANTED是已授予。
FULL是已满。
NOT_READY是未就绪。

（3）RedisE2BCapacityStore类
这是Python侧的封装。
构造时注册Lua脚本。
reserve、track、release、reconcile方法对应Lua操作。
每次调用都带hard_limit。
配置不一致时Redis端报错。
这是为了防止两个配置不同的Gateway共用一个账本。
reconcile返回true表示APPLIED。
返回false表示STALE。
close关闭Redis客户端。

（4）CapacityBackendError
Redis无法给出明确容量决定时抛这个异常。

（5）make_e2b_capacity_store工厂函数
它决定是否启用共享账本。
ownership类型是memory时不启用。
返回None。
ownership类型是redis时启用。
其他类型报错。

## 三、它和谁协作

这个模块依赖谁。
依赖redis库。
redis是可选extra。
依赖aio_sandbox.ownership的resolve_ownership_redis_url。
依赖config的SandboxOwnershipConfig。

谁调用这个模块。
同目录的e2b_sandbox_provider调用它。
provider在构造时创建容量存储。
acquire时reserve。
release时release。
后台线程定期reconcile。
它是多Gateway共享e2b容量的关键部件。

## 四、重要性评级

评级：6分。
理由：这是部署级容量控制的核心。Lua脚本把复杂的原子对账逻辑压在一个脚本里。修订号机制保证并发安全。META_FIELD_COUNT和实际写入的联动关系有测试钉住。它直接关系到云资源的钱。超限拒绝和容量对账出错都有明确路径。但它是可选的Redis部署才启用的部件。给6分。
