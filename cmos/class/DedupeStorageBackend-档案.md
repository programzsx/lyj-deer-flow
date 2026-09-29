# DedupeStorageBackend档案

一、这个类是干什么的

DedupeStorageBackend是去重存储后端的枚举类。这个类继承自StrEnum。这个类定义入站webhook去重状态存哪里。这个枚举有三个值。

二、类的成员

（一）枚举值

- AUTO：值为auto。自动选择。database.backend是postgres时复用Postgres应用数据库。否则用进程内memory存储。
- MEMORY：值为memory。强制用进程内存储。每个pod独立。副本之间不共享。
- POSTGRES：值为postgres。通过应用数据库跨pod共享去重状态。

（二）方法

StrEnum提供的能力。没有自定义方法。

三、它和谁协作

DedupeStorageConfig持有这个类。DedupeStorageConfig的backend字段的类型是这个枚举。ChannelManager的去重状态使用这个枚举。对应issue #4120的跨pod去重。

四、重要性评级

评级：4分。

理由：这个枚举只有三个值。去重状态是辅助状态。选错后端在单pod部署影响很小。多pod部署才需要关心。所以重要性偏低。
