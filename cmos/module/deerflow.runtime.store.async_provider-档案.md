# deerflow.runtime.store.async_provider-档案

## 一、这个模块是干什么的

这个文件是Store的异步工厂。

后端镜像运行时持久化配置。

支持三种后端。memory对应InMemoryStore。sqlite对应AsyncSqliteStore。postgres对应AsyncPostgresStore。

它提供异步上下文管理器。给FastAPI lifespan用。和检查点的异步工厂对齐。

## 二、模块里的主要成员

### 1、_ensure_postgres_schema

这个函数在LangGraph建表之前创建配置的schema。

它是异步版本。

### 2、_async_store上下文管理器

这是内部的后端工厂。

它构造并清理Store。

memory后端直接用InMemoryStore。

sqlite后端用AsyncSqliteStore。连接串解析同步做。父目录创建放到线程池。避免阻塞事件循环。

postgres后端先建schema。再把search_path注入DSN。然后用AsyncPostgresStore.from_conn_string。setup。

所有资源的进入和退出都用drained_async_context包住。调用方取消不能让资源在被检出状态下留给池自己的清理。

未知类型抛ValueError。

### 3、make_store

这是公开的异步上下文管理器。

它接收可选的AppConfig。None时读全局配置。

它用_resolve_store_config解析后端。这个函数从provider.py导入。

然后打开异步Store。yield给调用方。

legacy的checkpointer段优先。统一的database段其次。

只有解析的后端显式是memory时才返回InMemoryStore。

## 三、它和谁协作

它依赖config里的AppConfig。

它依赖persistence.postgres_schema里的异步schema工具。

它依赖runtime.cancellation里的drained_async_context。

它从runtime.store.provider导入配置解析和常量。

它被Gateway的FastAPI lifespan调用。

## 四、重要性评级

评级是5分。

理由是这个文件是Store持久化的生产入口。

它和检查点工厂的配置解析保持一致。Store和Checkpointer用同一个后端。

取消排空保证资源清理和宿主取消不竞争。

不评高分是因为Store是LangGraph的辅助键值存储。核心运行状态不经过它。逻辑量也小。
