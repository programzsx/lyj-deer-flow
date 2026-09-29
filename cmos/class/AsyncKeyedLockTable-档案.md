# AsyncKeyedLockTable-档案

## 一、这个类是干什么的

AsyncKeyedLockTable是runtime/keyed_lock.py里的类。

它是按键串行化的锁表。

它服务asyncio调用者。

KeyedLockTable是线程侧的对应物。给worker线程上的阻塞临界区用。

核心职责是同键工作串行化。

不保留空闲的键。

一个表可能被不同线程的事件循环共享。

每个循环收到自己的条目。

原因是asyncio.Lock在竞争时变成循环绑定的。

线程锁只保护注册表。

异步临界区绝不持有线程锁。

这个类位于backend/packages/harness/deerflow/runtime/keyed_lock.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_Entry数据类

- lock是一把asyncio.Lock。
- participants计数当前持有者加排队等待者。

### 2、hold方法

这是异步上下文管理器。

它持有当前事件循环的key锁。

finally路径保证释放和归还。

### 3、_checkout方法

在守卫锁下拿条目。

条目不存在时创建。

participants在等待锁之前递增。

这让条目在最终持有者或等待者离开前保持可发现。

新调用者不能创建第二把锁绕过已排队的等待者。

### 4、_checkin方法

participants递减。

没有参与者且锁未持有时移除条目。

键的条目已换时不动。

### 5、KeyedLockTable线程版

线程侧的对应物。

给阻塞临界区用。

### 6、设计理由

参与者计数是关键设计。

计数在await锁之前。

取消的等待者通过同一个finally路径归还参与计数。

这个模式被goal_thread_lock和sandbox的acquire_serialization共享使用。

## 三、它和谁协作

- runtime/goal.py的goal_thread_lock用它串行同线程的目标写入。
- KeyedLockTable是线程版对应物。
- 其他需要按key串行化的模块。

## 四、重要性评级

评级是6分。

理由如下。

这个类是按键串行化的基础设施。

参与者计数防止新调用者绕过已排队的等待者。

循环绑定条目处理多循环共享。

空闲键不保留防泄漏。

取消路径归还计数。

这些是并发正确性的细节。

但它是基础设施。

没有业务逻辑。

扣掉4分。
