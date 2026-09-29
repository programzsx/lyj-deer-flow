# deerflow.runtime.checkpointer.provider-档案

## 一、这个模块是干什么的

这个文件是同步检查点工厂。

检查点是LangGraph图状态的持久化存储。对话历史靠它跨轮存活。

这个文件提供同步单例和同步上下文管理器。给LangGraph图编译和CLI工具用。

支持三种后端。memory、sqlite、postgres。

单例在多次调用间复用。进程退出时关闭。

上下文管理器每次创建新连接。块退出时关闭。

## 二、模块里的主要成员

### 1、配置解析

#### （1）_resolve_checkpointer_config

这个函数从legacy或统一的应用配置里解析检查点后端。

legacy的checkpointer段存在时保持权威。这样Checkpointer和Store继续用同一个后端。

否则统一的database段驱动检查点。

database.backend是memory时返回memory类型。

是sqlite时返回sqlite加连接串。

是postgres时返回postgres加连接串和schema。

#### （2）_get_checkpointer_config

这个函数加载检查点配置。不持有单例锁。

先看legacy单例。legacy存在就用legacy。

再试get_app_config。配置文件不存在时返回memory。

### 2、错误消息常量

SQLITE_INSTALL、POSTGRES_INSTALL、POSTGRES_CONN_REQUIRED三个常量定义安装提示。

aio.provider也导入这些常量。

### 3、_sync_checkpointer_cm上下文管理器

这个上下文管理器创建并清理同步检查点。

memory后端直接用InMemorySaver。

sqlite后端用SqliteSaver.from_conn_string。先解析连接串。先建父目录。然后setup。

postgres后端先建schema。再把search_path注入DSN。然后用PostgresSaver.from_conn_string。setup。

未知类型抛ValueError。

缺少依赖包时抛带安装提示的ImportError。

### 4、get_checkpointer单例函数

这是全局同步检查点单例。第一次调用时创建。

执行顺序很讲究。

第一步。检查单例已存在就直接返回。

第二步。在provider锁外解析完整配置。配置加载可能重置持久化单例。

第三步。get_app_config可能触发配置重载。重载会调用reset_checkpointer。reset_checkpointer会拿_checkpointer_lock。这是不可重入锁。所以app_config必须在拿锁之前解析。避免锁序反转。

第四步。拿锁。二次检查。进入上下文管理器。delta模式时包装。包装失败时退出上下文再抛。

### 5、_wrap_sync_if_delta

这个函数在delta模式下把saver包装进delta历史缓存。

进程冻结的模式优先。database.checkpoint_channel_mode是未冻结时的回退。

只有memory缓存后端支持同步路径。同步路径是TUI和嵌入式客户端。它是进程本地的。

缓存配置是redis时抛ValueError。

缓存单例在容量或命名空间变化时重建。旧前缀下的条目不可达。不再被线程清理覆盖。

### 6、reset_checkpointer

这个函数重置同步单例。关闭连接。清缓存。测试和配置变更后用。

### 7、checkpointer_context

这是同步上下文管理器。不缓存实例。每个with块创建和销毁自己的连接。CLI脚本和测试用它。

## 三、它和谁协作

它依赖config里的AppConfig和CheckpointerConfig。

它依赖persistence.postgres_schema里的schema工具。

它依赖runtime.checkpoint_mode里的frozen_checkpoint_channel_mode。

它依赖runtime.store._sqlite_utils里的SQLite工具。

它被aio.provider导入错误常量。

它被runtime.checkpointer.cached_saver包装。

它被TUI、CLI、嵌入式客户端调用。

## 四、重要性评级

评级是8分。

理由是这个文件是检查点持久化的同步入口。

配置解析的优先级规则和锁序反转的防护都在这里。

delta模式的缓存包装决策在这里。

删掉它，TUI和嵌入式客户端没有检查点可用。

不评更高分是因为Gateway生产路径用异步工厂。这个文件服务同步场景。
