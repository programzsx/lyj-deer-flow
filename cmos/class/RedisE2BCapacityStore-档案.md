# RedisE2BCapacityStore-档案

## 一、这个类是干什么的

RedisE2BCapacityStore是community/e2b_sandbox/capacity/redis.py里的类。

它是部署级E2B容量的原子Redis Hash账本。

一个容量scope存在一个Redis Hash里。

多gateway进程共享一个e2b部署容量上限。

通过Lua脚本原子执行。

这个类位于backend/packages/harness/deerflow/community/e2b_sandbox/capacity/redis.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、错误和状态

CapacityBackendError是Redis无法返回确定容量决策时抛出。

ReserveStatus是GRANTED、FULL、NOT_READY。

### 2、Lua账本脚本

_LEDGER_SCRIPT是核心。

它在一个原子脚本里实现所有操作。

meta字段是state、hard_limit、revision。

META_FIELD_COUNT是3。

活跃条目按HLEN减这个数计。

两个必须一起动。

加meta字段不更新这个常量会让账本高计usage。

提前拒绝一个reservation。

测试固定它对照initialize的实际输出。

hard_limit不匹配时报配置错误。

reserve操作如下。

state非ready时返回NOT_READY。

reservation token已存在时返回GRANTED。幂等。

达到hard_limit时返回FULL。

否则HSET并递增revision。返回GRANTED。

release操作删除sandbox条目并递增revision。

track操作把reservation token换 成sandbox条目。

reconcile操作如下。

revision不匹配时返回STALE。

乐观并发。

complete时清扫stale条目。

sandbox条目缺失超过reservation_max_age_ms时删除。

reservation条目太老时删除。

然后state转ready。

### 3、RedisE2BCapacityStore方法

构造时hard_limit至少为1。

Redis lazy导入。可选extra。

register_script注册Lua脚本。

revision返回当前修订号。

reserve返回ReserveStatus。

track转换reservation。

release删除。

reconcile对账。STALE时返回False。

close关闭Redis客户端。

### 4、make_e2b_capacity_store

它只在Redis ownership时启用共享账本。

memory ownership返回None。进程内容量即可。

其他类型抛ValueError。

## 三、它和谁协作

- E2BSandboxProvider在多进程部署时用它保留容量。
- ownership配置提供Redis URL和key_prefix。
- resolve_ownership_redis_url解析URL。
- Lua脚本保证原子性。

## 四、重要性评级

评级是6分。

理由如下。

这个类是部署级e2b容量的核心。

Lua脚本原子执行。没有读改写竞争。

乐观并发的revision检查。

stale条目按TTL清扫。

meta字段计数的常量固定测试。

配置不匹配fail fast。

这些是多进程容量正确性的关键。

扣掉4分。

扣分原因是它是可选Redis附加。
