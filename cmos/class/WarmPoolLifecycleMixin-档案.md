# WarmPoolLifecycleMixin-档案

## 一、这个类是干什么的

WarmPoolLifecycleMixin是community/warm_pool_lifecycle.py里的泛型Mixin。

它是community沙箱提供者的warm-pool过期和replica生命周期机制。

warm pool是预热好的沙箱实例池。

新请求来时直接复用。省去冷启动。

空闲超时后销毁。replica软上限限制总数。

默认idle超时600秒。默认replicas为3。检查间隔60秒。

这个类位于backend/packages/harness/deerflow/community/warm_pool_lifecycle.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、类常量

DEFAULT_IDLE_TIMEOUT是600秒。

DEFAULT_REPLICAS是3。

IDLE_CHECK_INTERVAL是60秒。

_idle_checker_thread_name是warm-pool-idle-checker。

### 2、需要子类实现的钩子

_active_count_locked返回活跃条目数。要求持锁。

_destroy_warm_entry销毁已从池中移除的warm条目。

### 3、replica软上限

_replica_count返回配置replicas和当前活跃加warm总数。

_log_replicas_soft_cap记录软上限执行结果。

驱逐时记录info。

全部replica槽都在活跃使用时记录警告。沙箱超出软限制创建。

### 4、warm池驱逐

_evict_oldest_warm按时间戳移除并销毁最老的warm条目。

reason是replica_enforcement。

_reap_expired_warm移除并销毁超过idle_timeout的warm条目。

超时小于等于0时禁用。

锁下收集过期。锁外销毁。

reason是idle_timeout。

### 5、空闲检查线程

_start_idle_checker启动daemon线程。

周期清理空闲warm条目。

已活着时跳过。

_stop_idle_checker设置stop事件。join最多5秒。

_idle_checker_loop周期运行直到stop事件。

每60秒一次。

异常时记录。不打断循环。

_cleanup_idle_resources默认调_reap_expired_warm。

## 三、它和谁协作

- community的沙箱提供者继承它。例如opensandbox、e2b_sandbox。
- 提供者实现_active_count_locked和_destroy_warm_entry。
- 沙箱预热提供快速获取。

## 四、重要性评级

评级是5分。

理由如下。

这个Mixin是community沙箱warm池的生命周期机制。

空闲超时回收防止资源泄漏。

replica软上限防止池无限增长。

锁下收集锁外销毁的并发纪律。

空闲检查线程异常不打断循环。

这些机制被多个provider复用。

扣掉5分。

扣分原因是它是生命周期机械件。

不含业务决策。
