# DatabaseConfig档案

一、这个类是干什么的

DatabaseConfig是统一数据库后端的配置类。这个类同时控制LangGraph检查点和DeerFlow应用持久化层。用户只配置一个后端。系统处理物理分离细节。sqlite模式共享一个db文件。postgres模式共享同一个URL。memory模式不初始化数据库。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- backend：字面量。取值是memory、sqlite或postgres。默认值是memory。memory适合开发。sqlite适合单节点。postgres适合生产多节点。
- checkpoint_channel_mode：字面量。取值是full或delta。默认值是full。full保留完整值的消息检查点。delta用DeltaChannel。要求重启。共享检查点数据库的进程必须一致。
- checkpoint_delta：CheckpointDeltaConfig实例。这个字段是delta模式的检查点调优。
- checkpoint_graph_cache：CheckpointGraphCacheConfig实例。这个字段是编译检查点图缓存的大小上限。热加载。不要求重启。
- checkpoint_cache：CheckpointCacheConfig实例。这个字段是delta模式的历史缓存。纯性能项。
- sqlite_dir：字符串。默认值是.deer-flow/data。这个字段是sqlite数据库文件的目录。
- postgres_url：字符串。默认值是空字符串。这个字段是PostgreSQL连接URL。检查点和应用共享。用$DATABASE_URL引用.env。
- echo_sql：布尔值。默认值是False。这个字段表示是否把所有SQL语句打到日志。
- pool_size：整数。默认值是5。大于0。这个字段是应用ORM引擎的连接池大小。只对postgres生效。
- pool_recycle：整数。默认值是300。大于0。这个字段是postgres连接回收前的秒数。
- command_timeout：浮点数或None。默认值是30。大于0。这个字段是postgres命令超时秒数。null表示禁用。
- postgres_schema：字符串。默认值是空字符串。postgres时这是应用ORM表和检查点表的schema。空字符串保持服务器默认。只允许普通标识符。

（二）方法

- _validate_postgres_schema：字段校验器。校验postgres_schema的合法性。
- _reject_boolean_pool_settings、_reject_boolean_command_timeout：字段校验器。拒绝布尔值冒充数字。
- _migrate_legacy_snapshot_frequency：模型校验器。把旧顶层键checkpoint_delta_snapshot_frequency搬到嵌套位置。嵌套键优先。
- _resolved_sqlite_dir：属性。把sqlite_dir解析成绝对路径。
- sqlite_path：属性。统一的SQLite文件路径。检查点和应用共享。
- checkpointer_sqlite_path、app_sqlite_path：属性。sqlite_path的向后兼容别名。
- app_sqlalchemy_url：属性。应用ORM引擎的SQLAlchemy异步URL。自动加驱动后缀。
- app_sync_sqlalchemy_url：属性。应用ORM数据的同步URL。postgres_schema会合并进DSN。

三、它和谁协作

AppConfig持有这个类。AppConfig的database字段是这个类的实例。CONFIG_FILE_DATABASE_DEFAULTS为config.yaml缺失section提供默认。CheckpointDeltaConfig、CheckpointGraphCacheConfig和CheckpointCacheConfig是这个类的字段类型。持久化层和检查点都从这个实例取连接。

四、重要性评级

评级：8分。

理由：数据库是持久化的统一入口。backend决定数据存哪里。URL解析和schema处理错误会让整个持久化层不可用。所以重要性高。
