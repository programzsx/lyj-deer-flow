# 模块档案：deerflow.community.warm_pool_lifecycle

## 一、这个模块是干什么的

这个模块是社区沙箱提供商共用的"温池"生命周期工具。
先解释温池是什么。
沙箱创建很慢。
所以沙箱用完之后不马上销毁。
沙箱先放进一个池子里保温。
下一个同身份的请求来了直接复用。
这个池子就叫温池。
温池带来两个管理问题。
第一个问题是温池里的沙箱闲置太久要回收。
第二个问题是沙箱总数不能超过配置的replicas上限。
每个社区沙箱提供商都要实现这两套逻辑。
这个模块把这两套逻辑抽成一个Mixin。
提供商继承这个Mixin就不用重复写。

## 二、模块里的主要成员

（1）WarmPoolLifecycleMixin
这是模块的核心类。
这是一个泛型Mixin。
泛型参数WarmEntryT代表温池条目的类型。
这个Mixin要求宿主类提供两个东西。
第一个是_lock，一个线程锁。
第二个是_warm_pool，一个字典。
字典的键是沙箱id。
字典的值是条目加时间戳的元组。
Mixin还声明了两个必须由子类实现的方法。
_act ive_count_locked在持锁状态下返回活跃条目数。
_destroy_warm_entry负责销毁一个已经移出池子的条目。

（2）池子管理方法
_replica_count返回配置的replicas和当前总数。
总数等于活跃数加热池数。
_evict_oldest_warm按时间戳找最老的条目。
找到后移出并销毁。
这个方法用于replicas软上限的执行。
_reap_expired_warm清理超过idle_timeout秒没活动的条目。
默认超时是600秒。

（3）后台清理线程
_start_idle_checker启动一个守护线程。
线程名叫warm-pool-idle-checker。
线程每60秒醒一次。
每次醒来做一次闲置清理。
_stop_idle_checker停掉线程并等待退出。
默认replicas是3。

## 三、它和谁协作

这个模块依赖谁。
只依赖标准库。
用到的标准库有logging、threading、time、typing。

谁调用这个模块。
boxlite的BoxliteProvider继承它。
opensandbox的OpenSandboxProvider继承它。
tenki的TenkiSandboxProvider继承它。
这三个提供商各自实现_act ive_count_locked和_destroy_warm_entry。
e2b_sandbox_provider没有继承它。
因为e2b的池子逻辑更复杂。
e2b要支持多Gateway共享所有权和容量对账。
所以e2b自己实现了一套。

## 四、重要性评级

评级：5分。
理由：这是一个纯标准库的基础设施模块。它被三个沙箱提供商共用。它把池子回收和容量上限这两套容易写错的并发逻辑集中到了一处。它定义了清晰的子类契约。子类只需要关心怎么数数和怎么销毁。它自身不接触任何外部服务。它是可选集成的支撑件。所以给5分。
