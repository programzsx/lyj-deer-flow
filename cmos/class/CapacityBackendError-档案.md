# CapacityBackendError-档案

## 一、这个类是干什么的

CapacityBackendError是community/e2b_sandbox/capacity/redis.py里的异常类。

它继承RuntimeError。

它表示Redis不能返回确定性的容量决定。

这个文档覆盖CapacityBackendError加ReserveStatus。

位于backend/packages/harness/deerflow/community/e2b_sandbox/capacity/redis.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、CapacityBackendError

它继承RuntimeError。

Redis不能返回确定性容量决定时抛出。

### 2、ReserveStatus

它是enum.StrEnum。

GRANTED是授予。

FULL是满了。

NOT_READY是未就绪。

### 3、Redis容量store的语义

RedisE2BCapacityStore是一个容量scope存在一个Redis Hash里。

Lua脚本保证原子性。

hard_limit至少1。

E2B sandbox的容量账本跨gateway实例共享。

## 三、它和谁协作

- RedisE2BCapacityStore抛CapacityBackendError。
- ReserveStatus是reserve操作的返回值。
- E2BSandboxProvider的容量检查消费它。

## 四、重要性评级

评级是4分。

理由如下。

这个类是容量决定失败 fail-loud 的信号。

Redis不能决定时抛出。不猜测。

ReserveStatus的三态清晰。GRANTED、FULL、NOT_READY。

Lua脚本保证原子账本。

扣掉6分。

扣分原因是它是小异常类。作用域限于E2B容量。
