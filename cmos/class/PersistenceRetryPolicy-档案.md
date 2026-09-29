# PersistenceRetryPolicy档案

源码位置：backend/packages/harness/deerflow/runtime/runs/manager.py

## 一、这个类是干什么的

PersistenceRetryPolicy是一个配置数据类。

PersistenceRetryPolicy定义短store写入的有界重试策略。

SQLite存储在写入压力下会出现短暂锁竞争。锁竞争表现为database is locked等异常。这类异常是瞬时的。重试可以解决。

PersistenceRetryPolicy控制重试怎么进行。重试有上限。不能无限重试。永久性失败不会被隐藏。

RunManager的_call_store_with_retry使用这个策略。所有store写入都经过它。

## 二、类的成员

（一）字段

- `max_attempts`：最大尝试次数。默认5。超过次数就抛出原始异常。
- `initial_delay`：第一次重试前的延迟秒数。默认0.05。
- `max_delay`：最大延迟秒数。默认1.0。延迟不会超过这个值。
- `backoff_factor`：延迟增长倍数。默认2.0。每次重试延迟翻倍。

（二）方法

PersistenceRetryPolicy是frozen dataclass。PersistenceRetryPolicy没有自定义方法。

## 三、它和谁协作

（一）RunManager

RunManager在构造时接收PersistenceRetryPolicy。没有传入就用默认值。_call_store_with_retry按策略重试。

（二）_is_retryable_persistence_error

manager.py的_is_retryable_persistence_error函数判断异常是否可重试。只有SQLite瞬时错误才重试。策略本身不判断异常类型。

## 四、重要性评级

评级：3分。

理由：PersistenceRetryPolicy让运行状态落库能扛住SQLite短暂锁竞争。终态写入失败是严重问题。这个小策略保护了它。策略是纯配置。没有逻辑。所以给3分。
