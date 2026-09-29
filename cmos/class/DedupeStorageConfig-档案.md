# DedupeStorageConfig档案

一、这个类是干什么的

DedupeStorageConfig是入站webhook去重存储的配置类。这个类控制ChannelManager的去重状态存哪里。默认值auto会自动选择。database.backend是postgres时复用Postgres应用数据库。否则用进程内memory存储。对应issue #4120的跨pod去重。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- backend：DedupeStorageBackend类型。默认值是AUTO。这个字段是去重存储后端。auto表示自动选择。memory表示强制进程内存储。每个pod独立。postgres表示跨pod共享。

（二）方法

这个类没有自定义方法。字段描述通过format_field_description生成。这个描述会随热加载边界文档化。

三、它和谁协作

AppConfig持有这个类。AppConfig的dedupe_storage字段是这个类的实例。DedupeStorageBackend是这个字段的类型。ChannelManager读取这个实例来构建去重存储。

四、重要性评级

评级：4分。

理由：去重是消息投递的辅助保障。单pod部署用默认值就够了。多pod部署才需要显式配置。所以重要性偏低。
