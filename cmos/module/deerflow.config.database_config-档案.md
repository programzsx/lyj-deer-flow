# deerflow.config.database_config-档案

## 一、这个模块是干什么的

这个模块管理统一数据库配置。

DeerFlow有两类持久化数据。

一类是LangGraph的检查点数据。

一类是应用数据，比如运行、线程元数据、用户。

这个模块让用户只配置一个数据库后端。

系统自己处理两类数据在物理上的安排。

支持三种后端：memory、sqlite、postgres。

memory用于开发，重启即丢。

sqlite用于单节点部署。

postgres用于生产多节点部署。

## 二、模块里的主要成员

### 1、DatabaseConfig类

`backend`选择后端。

`sqlite_dir`是sqlite文件目录。

检查点和应用数据共享同一个`deerflow.db`文件。

`postgres_url`是postgres连接串。

配置里用`$DATABASE_URL`引用环境变量。

`pool_size`和`pool_recycle`是连接池参数。

`postgres_schema`指定postgres的schema。

### 2、SQLite的WAL设计

sqlite模式开启WAL日志模式。

WAL允许并发读和单个写。

这样共享一个文件对两类工作负载都是安全的。

写冲突通过默认5秒的busy timeout等待，而不是立即失败。

### 3、检查点子配置

`checkpoint_channel_mode`选检查点表示方式。

`full`保存完整消息快照。

`delta`用增量通道，检查点更小但物化更慢。

`CheckpointDeltaConfig`调增量模式的快照频率。

这个值必须重启才生效，而且共享一个检查点库的所有进程必须一致。

`CheckpointGraphCacheConfig`限制编译图缓存的容量。

这个配置是热重载的，不需要重启。

`CheckpointCacheConfig`配置增量历史的缓存。

`CheckpointDeltaConfig`等缓存配置只在delta模式下生效。

### 4、URL派生属性

`app_sqlalchemy_url`给出异步URL。

sqlite拼出`sqlite+aiosqlite:///`。

postgres把连接串改写成`postgresql+asyncpg://`驱动。

`app_sync_sqlalchemy_url`给出同步URL。

同步URL服务于按需同步执行的代理存储。

postgres的同步路径还会把schema塞进DSN的search_path。

### 5、旧键迁移

`_migrate_legacy_snapshot_frequency()`搬运旧版平铺键。

旧键是`checkpoint_delta_snapshot_frequency`。

新键是嵌套的`checkpoint_delta.snapshot_frequency`。

没有这个迁移，按旧键写的配置会静默回落到默认值。

### 6、辅助函数

`resolve_checkpoint_graph_cache_max()`从配置对象里读图缓存上限。

这个函数容忍测试里的桩配置对象。

## 三、它和谁协作

`app_config.py`的`database`字段是这份配置。

`checkpointer_config.py`共享`postgres_schema`的校验逻辑。

持久化层和检查点工厂消费这里的URL派生属性。

## 四、重要性评级

评级：9分。

理由：所有持久化数据的后端选择都在这里。URL派生逻辑覆盖多种驱动拼写，容易出错。检查点模式的跨进程一致性要求也在这里声明。
