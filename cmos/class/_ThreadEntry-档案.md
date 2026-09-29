# _ThreadEntry档案

源码位置：`backend/packages/harness/deerflow/runtime/keyed_lock.py`

## 一、这个类是干什么的

这个类是一张线程侧的内部表项。

这个类服务阻塞式调用方。

这个类是`_Entry`的线程版对应物。

`_Entry`用`asyncio.Lock`。

`_ThreadEntry`用`threading.Lock`。

`asyncio.Lock`服务asyncio调用方。

`threading.Lock`服务工作线程上的阻塞临界区。

一个键对应一把线程锁。

这个类把锁和参与者计数绑在一起。

锁负责跨线程互斥。

参与者计数负责回收。

没有参与者计数。

空闲的键会在表里越积越多。

有参与者计数。

最后一个持有者或等待者离开时。

表项可以被回收。

这个类用了`@dataclass(slots=True)`。

`slots=True`让实例更省内存。

这个类是模块私有的。

类名以下划线开头。

外部代码不直接用这个类。

外部代码只通过`KeyedLockTable.hold`间接使用它。

## 二、类的成员

### （一）字段

- `lock`：这个键对应的`threading.Lock`。负责同一键上跨线程工作的互斥。调用线程会阻塞在这把锁上。
- `participants`：参与者计数。整数，默认0。统计"当前持有者加排队等待者"的总数。计数大于0时表项必须留在表里。计数归0且锁已释放时表项可以被回收。

### （二）方法

这个类没有方法。

dataclass自动生成`__init__`等方法。

这个类只承载数据。

操作逻辑都在`KeyedLockTable`的`_checkout`和`_checkin`里。

## 三、它和谁协作

这个类和`KeyedLockTable`协作。

`KeyedLockTable`的`_entries`字典存这个类的实例。

线程版的表不需要按事件循环分组。

因为`threading.Lock`不绑定事件循环。

`_checkout`在拿到锁之前把`participants`加1。

`_checkin`在锁释放后把`participants`减1。

`_checkin`看到计数归0。

且锁没被持有。

且表里存的还是这个表项。

就把它从表里删掉。

这个类和worker线程协作。

工作线程上的阻塞临界区通过`hold`进入。

临界区阻塞调用线程。

但临界区从不持有注册表的guard锁。

guard锁只保护注册表本身。

## 四、重要性评级

评级：3分（满分10分）。

理由：

- 这个类是纯数据容器。
- 没有任何业务逻辑。
- 它是`_Entry`的线程版镜像。
- 两个字段和`_Entry`完全对应。
- 但它支撑的是跨线程互斥。
- `participants`保证了等待者不会被绕过。
- 它是`KeyedLockTable`正确性的内部支撑。
- 私有数据类评2到3分档。
- 评3分。
