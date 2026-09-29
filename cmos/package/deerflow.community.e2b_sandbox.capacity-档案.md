# deerflow.community.e2b_sandbox.capacity档案

本文档解读deerflow.community.e2b_sandbox.capacity这个子包。

本文档基于对该包目录下全部代码文件的实际阅读。

本文档的读者是想理解E2B部署级容量管理的开发者。

## 一、这个包是干什么的

这个子包是Redis支持的部署级E2B容量账本。

问题的背景如下。

E2B沙箱跑在E2B的云上。

云沙箱要花钱。

replicas配置限制了并发沙箱数。

但多个Gateway实例各管各的容量时。

总量会超过replicas。

费用会失控。

这个子包用Redis维护一份全部署共享的容量账本。

所有Gateway实例向同一份账本预留和释放容量。

总量就不会超。

这个子包是E2B容量的共享限制。

## 二、包里的主要成员

### 1、RedisE2BCapacityStore

RedisE2BCapacityStore是一个Redis Hash里的一个容量作用域。

整个账本存在一个Redis Hash里。

Hash里有三种字段。

第一种是meta:开头的元数据字段。

元数据有state、hard_limit、revision三个。

第二种是r:开头的预留字段。

预留字段是创建中的沙箱。

第三种是s:开头的在场字段。

在场字段是已确认存在的沙箱。

RedisE2BCapacityStore的方法如下。

reserve为一个新VM预留容量。

预留成功返回GRANTED。

容量满了返回FULL。

账本还没初始化好返回NOT_READY。

track把预留转成在场记录。

release释放一个沙箱的容量。

reconcile用远程清单调和账本。

revision读取账本的版本号。

版本号用于乐观并发检测。

### 2、_LEDGER_SCRIPT

_LEDGER_SCRIPT是核心的Lua脚本。

所有操作都走这一个脚本。

一个脚本让读和写不能被对等实例穿插。

脚本里的关键设计如下。

配置不匹配会报错。

配置的hard_limit和账本里的不一致时。

脚本直接返回错误。

这防止两个配置不同的实例污染同一份账本。

预留的原子性如下。

先查预留字段是否已存在。

已存在直接返回GRANTED。

再数当前用量。

用量是HLEN减去元数据字段数。

用量达到hard_limit返回FULL。

没满就写入预留字段并递增版本号。

HLEN计数依赖META_FIELD_COUNT常量。

这个常量必须和initialize写的元数据字段数一致。

加一个元数据字段不改常量会让账本多算用量。

有一个测试钉住这个一致性。

调和的设计如下。

版本号不匹配返回STALE。

STALE让调用方下次重试。

complete为1时才清理缺失条目。

缺失条目先标记missing_since。

标记后要等过宽限期才删除。

这避免一次不完整的清单误删活沙箱。

过期的预留也会被清理。

预留过了最大年龄就删除。

时间用Redis自己的TIME命令。

用Redis时间避免了各实例时钟不一致的问题。

### 3、ReserveStatus

ReserveStatus是预留结果的枚举。

GRANTED表示预留成功。

FULL表示容量已满。

NOT_READY表示账本还在初始化。

### 4、CapacityBackendError

CapacityBackendError表示Redis无法给出明确的容量决策。

这个异常让调用方fail closed。

### 5、make_e2b_capacity_store

make_e2b_capacity_store根据配置构建容量存储。

只在Redis所有权下才启用共享账本。

ownership.type是memory时返回None。

返回None表示单实例部署不需要共享账本。

单实例用进程内的本地容量就够了。

ownership.type不是redis也不是memory时抛ValueError。

Redis端点复用aio_sandbox.ownership.factory里的resolve_ownership_redis_url。

两个子包共享同一个Redis端点解析。

## 三、它和谁协作

这个子包依赖的外部组件如下。

- Redis，必需
- deerflow.community.aio_sandbox.ownership，复用Redis端点解析
- deerflow.config.sandbox_config，读取SandboxOwnershipConfig

这个子包被谁调用。

E2BSandboxProvider在构造时创建容量存储。

Provider的_reserve_capacity先预留本地容量。

再向这个账本预留部署级容量。

Provider的调和线程用reconcile同步远程清单。

Provider的创建、回收、销毁路径调用track和release。

## 四、重要性评级

评级：6分。

理由如下。

多实例共享E2B时，容量账本是必需品。

没有账本，replicas限制会失效。

云沙箱费用会失控。

Lua脚本的设计很严谨。

配置不匹配检测、乐观版本号、缺失宽限期都考虑到了。

扣分的原因如下。

它只服务于E2B这一个沙箱。

只服务于Redis多实例部署。

单实例部署返回None。

AIO沙箱完全不用它。

使用面很窄。

它是容量协调的一个专用组件。

不是通用基础设施。

整体代码量不到300行。
