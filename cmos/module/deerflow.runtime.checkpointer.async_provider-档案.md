# deerflow.runtime.checkpointer.async_provider-档案

## 一、这个模块是干什么的

这个文件是异步检查点工厂。

它提供异步上下文管理器。给长时间运行的异步服务器用。FastAPI的lifespan是主要调用方。

资源在进入时打开。退出时关闭。没有全局状态。

支持三种后端。memory、sqlite、postgres。

## 二、模块里的主要成员

### 1、_build_postgres_pool

这个函数构建AsyncConnectionPool。

连接参数有这些。autocommit开启。prepare_threshold是0。行工厂是dict_row。TCP keepalive开启。idle是60秒。interval是10秒。count是6。

search_path注入到DSN里。注入方式是合并到连接串的libpq options。不用kwargs的options参数。kwargs方式会叠加在连接串之上。会静默丢掉DSN提供的选项。比如statement_timeout。

这里还剥离SQLAlchemy的+driver后缀。libpq才能解析DSN。

### 2、_ensure_postgres_schema_with_pool

这个函数在LangGraph建表之前创建配置的schema。

它用drained_async_context包住pool.connection()。调用方取消不能让连接在被检出状态下留给池自己的清理。这是backend所有权不变量。

### 3、_async_checkpointer和_async_checkpointer_from_database

这两个内部上下文管理器构造并清理检查点。

一个从legacy的checkpointer配置构造。一个从统一的database配置构造。

memory后端直接用InMemorySaver。

sqlite后端用AsyncSqliteSaver。连接串准备放到线程池。避免阻塞事件循环。

postgres后端先建池。再建schema。再创建AsyncPostgresSaver。setup。

所有资源的进入和退出都用drained_async_context包住。

### 4、_select_inner_checkpointer

这个函数yield原始检查点。不做delta缓存包装。

优先级是三步。legacy的checkpointer段优先。统一的database段其次。默认InMemorySaver。

### 5、make_checkpointer

这是公开的异步上下文管理器。

它接收可选的AppConfig。None时读全局配置。

它在_select_inner_checkpointer里打开底层saver。

然后判断模式。进程冻结的模式优先。database.checkpoint_channel_mode是回退。

模式是delta时。用make_checkpoint_cache创建历史缓存。缓存的生存期等于这个上下文管理器的。yield CachedHistorySaver包装后的saver。

模式不是delta时。直接yield原始saver。

## 三、它和谁协作

它依赖config里的AppConfig。

它依赖persistence.postgres_schema里的schema工具。

它依赖runtime.cancellation里的drained_async_context。

它从runtime.checkpointer.provider导入错误消息常量。

它依赖runtime.checkpoint_cache.provider和cached_saver。

它被Gateway的FastAPI lifespan调用。

它是生产路径的检查点入口。

## 四、重要性评级

评级是8分。

理由是这个文件是Gateway生产路径的检查点入口。

所有生产流量的对话状态都从这里分配的checkpointer经过。

postgres连接池的keepalive和DSN处理细节在这里。

取消排空保证资源清理不和宿主取消竞争。

不评更高分是因为核心的状态访问逻辑在checkpoint_state.py。这个文件只管资源生命周期。
