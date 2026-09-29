# ExtensionData档案

一、这个类是干什么的

ExtensionData是交给扩展的按作用域类型化存储类。这个类不是dataclass。这个类是扩展私有的状态存储。存储挂在宿主拥有的作用域上。作用域可以是app或task。宿主在每个作用域创建一个实例。作用域结束时丢弃。

二、类的成员

（一）方法

- scope_id：属性。这个属性是存储挂载的宿主作用域身份。
- get(typ)：这个方法按类型取存储的值。没有返回None。
- get_or_init(typ, init)：这个方法取存储的值。不存在时用init创建。init在锁内运行。init可以组合这个存储里的其他状态。重量级的惰性工作属于存储值本身。
- set(value)：这个方法按值的类型存值。
- remove(typ)：这个方法按类型删除值。返回被删的值。

存储按类型而不是按字符串做键。独立的扩展不能在同一个键上冲突。内部用RLock保证线程安全。

三、它和谁协作

TaskLifecycleContributor、ContextCompactionObserver、SystemModelCallObserver和AgentAssemblyObserver的回调签名都接收这个类。宿主在每次回调时把当前作用域的存储交给扩展。扩展不需要检查句柄是否过期。

四、重要性评级

评级：7分。

理由：这个类是扩展持久状态的标准容器。所有观察者协议都用它。类型做键避免冲突。线程安全。所以重要性中上。
