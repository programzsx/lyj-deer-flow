# deerflow.runtime.store.provider-档案

## 一、这个模块是干什么的

这个文件是Store的同步工厂。

Store是LangGraph的键值存储。存的是通用键值数据。不是检查点。检查点是checkpoint store。这是另一个东西。

这个文件提供同步单例和同步上下文管理器。给CLI工具和嵌入式客户端用。

被弃用的checkpointer配置段存在时优先。否则Store跟随统一的database段。

支持三种后端。memory、sqlite、postgres。

## 二、模块里的主要成员

### 1、错误消息常量

SQLITE_STORE_INSTALL、POSTGRES_STORE_INSTALL、POSTGRES_CONN_REQUIRED三个常量定义安装提示。

### 2、配置解析

#### （1）_resolve_store_config

这个函数从legacy或统一的应用配置里解析Store后端。

legacy的checkpointer段存在时保持权威。这样Store和Checkpointer继续用同一个后端。

否则统一的database段驱动Store。

统一的postgres_schema被转发。Store的表落在配置的schema里。和检查点、应用表在一起。

#### （2）_get_store_config

这个函数加载Store配置。不持有单例锁。

先看legacy单例。legacy存在就用。

再试get_app_config。配置文件不存在时返回memory。

### 3、_sync_store_cm上下文管理器

这个上下文管理器创建并清理同步Store。

memory后端用InMemoryStore。

sqlite后端用SqliteStore.from_conn_string。先解析连接串。先建父目录。然后setup。

postgres后端先建schema。再把search_path注入DSN。然后用PostgresStore.from_conn_string。setup。

未知类型抛ValueError。

### 4、get_store单例函数

这是全局同步Store单例。第一次调用时创建。

执行顺序和检查点工厂一样讲究。

第一步。单例已存在直接返回。

第二步。在锁外解析完整配置。配置加载可能重置两个持久化单例。在provider锁外解析。避免跨provider的锁序反转。

第三步。拿锁。二次检查。进入上下文管理器。保存。

### 5、reset_store

这个函数重置同步单例。关闭连接。清缓存。测试和配置变更后用。

### 6、store_context

这是同步上下文管理器。不缓存实例。每个with块创建和销毁自己的连接。CLI脚本和测试用它。

## 三、它和谁协作

它依赖config里的AppConfig和CheckpointerConfig。

它依赖persistence.postgres_schema里的schema工具。

它依赖runtime.store._sqlite_utils里的SQLite工具。

它被runtime.store.async_provider复用配置解析。

它被CLI和嵌入式客户端调用。

## 四、重要性评级

评级是5分。

理由是这个文件是Store持久化的同步入口。

配置解析和单例锁序的防护与检查点工厂保持一致。

不评高分是因为Store是LangGraph的辅助存储。核心的运行状态不经过它。生产Gateway用异步工厂。
