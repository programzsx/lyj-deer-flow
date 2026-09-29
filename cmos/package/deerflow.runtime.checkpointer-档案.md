# deerflow.runtime.checkpointer-档案

## 一、这个包是干什么的

这个包是DeerFlow的"检查点器工厂"包。

包名是`deerflow.runtime.checkpointer`。源码在`backend/packages/harness/deerflow/runtime/checkpointer/`。

大白话讲。LangGraph的智能体运行需要检查点器（checkpointer）。检查点器负责把每次状态变化存下来。这个包负责创建检查点器。它读配置。它选后端。它装依赖。它建连接。它还负责在delta模式下把原始saver包进缓存包装器。

支持三种后端。memory（进程内）。sqlite（单机文件）。postgres（生产数据库）。

这个包提供两套工厂。同步工厂给TUI、嵌入式客户端和CLI工具用。异步工厂给长期运行的异步服务器（Gateway的FastAPI lifespan）用。

## 二、包里的主要成员

### 1、__init__.py

它重新导出四个符号。`make_checkpointer`（异步工厂）。`get_checkpointer`、`reset_checkpointer`、`checkpointer_context`（同步侧）。

### 2、provider.py（同步工厂）

这个模块提供同步单例和同步上下文管理器。

- `get_checkpointer()`。全局同步单例。第一次调用时创建。之后复用。进程退出时关闭。加锁保护。配置加载在锁外完成。避免跨provider的锁顺序反转。
- `checkpointer_context()`。同步上下文管理器。每个`with`块创建并销毁自己的连接。不缓存实例。给CLI脚本和测试用。要确定性清理。
- `reset_checkpointer()`。重置单例。关闭连接。给测试和配置变更后用。

后端解析逻辑。旧的`checkpointer:`配置节优先。旧的节存在时保持Checkpointer和Store用同一个后端。否则统一的`database:`节驱动检查点器。和异步工厂、同步Store提供者一致。都没有时用`InMemorySaver`。

各后端的创建细节。

- memory。直接`InMemorySaver()`。进程内，不持久化。
- sqlite。`SqliteSaver.from_conn_string()`。先解析连接串。先建父目录。然后`setup()`建表。依赖缺失抛带安装提示的`ImportError`。
- postgres。`PostgresSaver.from_conn_string()`。先用配置的schema建schema。再给DSN注入`search_path`。然后`setup()`建表。连接串缺失抛`ValueError`。

错误消息常量。`SQLITE_INSTALL`、`POSTGRES_INSTALL`、`POSTGRES_CONN_REQUIRED`。异步工厂也导入这些常量。

delta包装。`_wrap_sync_if_delta()`在生效模式是delta时把saver包进`CachedHistorySaver`。进程冻结的模式优先。`database.checkpoint_channel_mode`是未冻结时的回退。同步路径只支持memory缓存后端。配redis会抛`ValueError`。缓存单例在容量或命名空间变化时重建。旧前缀下的条目不可达。也不再被线程清除覆盖。

### 3、async_provider.py（异步工厂）

这个模块提供异步上下文管理器。给FastAPI lifespan用。

- `make_checkpointer()`。公开异步工厂。进入时打开资源。退出时关闭。没有全局状态。后端选择优先级同上。
- `_async_checkpointer()`和`_async_checkpointer_from_database()`。两个内部构造器。分别处理旧配置节和统一数据库节。
- `_build_postgres_pool()`。构建`AsyncConnectionPool`。带TCP keepalive和连接检查。DSN通过`dsn_with_search_path`加`normalize_libpq_dsn`处理。把`search_path`注入DSN。而不是用kwargs的options。psycopg的options会叠加在conninfo之上。可能静默丢掉DSN自带的选项（比如`statement_timeout`）。同时剥掉SQLAlchemy的`+driver`后缀让libpq能解析。
- `_ensure_postgres_schema_with_pool()`。建schema。用`drained_async_context`包住连接。调用方取消不能让连接在池的清理运行时仍被占用。
- sqlite路径。`asyncio.to_thread`卸载路径准备。`AsyncSqliteSaver`的进入和退出用`drained_async_context`排空。

delta包装。`make_checkpointer()`在生效模式是delta时。用`make_checkpoint_cache()`（寿命与工厂相同）创建缓存。产出`CachedHistorySaver(saver, cache, key_prefix=...)`。

### 4、cached_saver.py（读穿缓存包装器）

`CachedHistorySaver`类。继承`BaseCheckpointSaver`。它是任意检查点器的读穿缓存包装器。

它只重写一个行为。`aget_delta_channel_history()`（和它的同步孪生`get_delta_channel_history()`）。这是delta模式下读取通道历史的入口。

正确性论证写在模块docstring里。检查点的delta历史是它封存祖先链的纯函数。按（thread，ns，checkpoint_id，channel）键控的条目不可变。所以不需要失效。共享后端跨进程协调一致。包装器从不缓存"最新检查点"的解析。只缓存按已解析的不可变checkpoint_id键控的历史。

核心算法是`_aresolve()`（递归组合）。

- 真实运行每个super步创建多个检查点。只有一些被物化为目标。父检查点通常是未预热的中间检查点。
- 从父检查点递归组合。一层一层向上。落在已预热的祖先上。稳态运行大约2层。
- 每个组合层都被缓存。所以预热前沿跟着运行走。
- 深度预算`_COMPOSE_MAX_DEPTH`是8。冷链在深度0时委派一次内部快速路径走查（2条SQL）。而不是逐个祖先抓取元组。
- 统计。`compose_hits`和`full_walks`进入`stats()`。

其他方法全部显式委派给内部saver。`get_tuple`、`list`、`put`、`put_writes`、`delete_thread`等。`__getattr__`是安全网。只对saver特有的属性生效（比如`AsyncSqliteSaver.setup`）。

数据生命周期。`delete_thread()`和`prune()`会清除对应线程的缓存条目。因为源检查点被删了。缓存载荷不能残留。`delete_for_runs()`不清缓存。运行范围的删除无法廉价映射回线程。缓存条目保持正确。残留保留由LRU或TTL约束。树上目前没有调用方。

## 三、它和谁协作

### 1、上游

- `deerflow.config`。`AppConfig`、`CheckpointerConfig`、`DatabaseConfig`提供后端选择。
- `deerflow.runtime.checkpoint_mode`。冻结模式读取。决定是否包delta缓存。
- `deerflow.runtime.checkpoint_cache`。缓存后端和键前缀。
- `deerflow.runtime.store._sqlite_utils`。SQLite连接串解析和父目录创建。
- `deerflow.persistence.postgres_schema`。schema创建和DSN处理。
- `deerflow.runtime.cancellation`。`drained_async_context`保证异步清理跨界安全。
- LangGraph本体。`InMemorySaver`、`SqliteSaver`、`PostgresSaver`、`AsyncSqliteSaver`、`AsyncPostgresSaver`。
- psycopg和psycopg_pool。Postgres连接池。

### 2、下游（被谁用）

全仓库搜索`runtime.checkpointer`的导入引用有31处（不含runtime自身）。引用文件包括。

- `backend/app/gateway/deps.py`和`backend/app/gateway/health.py`。Gateway装配和健康检查。
- `backend/packages/harness/deerflow/client.py`。嵌入式客户端。
- `backend/packages/harness/deerflow/config/app_config.py`。配置重载时重置单例。
- `backend/packages/harness/deerflow/runtime/store/async_provider.py`和`stream_bridge/async_provider.py`。兄弟工厂参照同样的模式。
- `backend/packages/harness/deerflow/tui/session.py`。终端会话。
- `backend/scripts/benchmark/checkpoint/bench_channels.py`。基准测试。
- `backend/tests/`下的多个测试文件。`test_checkpointer.py`、`test_checkpoint_mode.py`、`test_cached_history_saver.py`、`test_app_config_reload.py`、`test_gateway_run_recovery.py`等。

### 3、依赖方向

这个包属于harness层。不导入app层。可选依赖（langgraph-checkpoint-sqlite、langgraph-checkpoint-postgres、psycopg_pool、redis）全部懒加载。缺失时抛带安装提示的错误。

## 四、重要性评级

评级是7分。

理由如下。

这个包是检查点持久化的装配点。Gateway启动时通过它拿到检查点器。没有检查点器。智能体的多轮对话、回滚、恢复全部失效。

它被引用的地方较多。全仓库导入引用有31处。Gateway的`deps.py`和`health.py`、嵌入式客户端、TUI、配置重载、多个测试都依赖它。被引用的文件数超过20个。

它处在启动和运行的核心路径上。每个需要持久化的部署都要经过`make_checkpointer()`或`get_checkpointer()`。delta模式生产部署还要经过`CachedHistorySaver`。

删除它会怎样。Gateway启动失败。`deps.py`装配检查点器时直接报错。嵌入式客户端和TUI同样失败。所有依赖检查点持久化的功能不可用。

为什么是7分不是更高分。它做的是装配和包装工作。核心的检查点逻辑在LangGraph的上游库里。核心的检查点访问安全在`checkpoint_mode.py`和`checkpoint_state.py`里。这个包本身可以被较薄的替代品替换。工作量有限。

为什么不是更低分。它不是可选的。三种后端、新旧两套配置、同步异步两条路径的兼容逻辑都在这里。delta缓存包装的正确性论证也在它这里。删掉它没有任何东西能顶上。
