# deerflow.runtime包档案

## 一、这个模块是干什么的

deerflow.runtime包是LangGraph兼容运行时的包门面。

源文件是backend/packages/harness/deerflow/runtime/__init__.py。

它的角色是聚合式大门面。

它重新导出runs和stream_bridge等模块的公共API。

docstring说明了聚合目的。

目的是让消费者直接从deerflow.runtime导入。

不必深入到子模块。

它没有懒加载。

它把全部公共API在导入时一次性提供。

## 二、模块里的主要成员

它从六个模块导入成员。

checkpoint_state模块提供CheckpointStateAccessor、build_state_mutation_graph。

checkpointer模块提供checkpointer_context、get_checkpointer、make_checkpointer、reset_checkpointer。

runs模块提供run_agent、RunManager、RunRecord、RunContext、RunStatus、CancelOutcome、ConflictError、DisconnectMode、ThreadOperationKind、UnsupportedStrategyError、ORPHAN_RECOVERY_STOP_REASON、STARTUP_ORPHAN_RECOVERY_ERROR。

serialization模块提供serialize、serialize_channel_values、serialize_channel_values_for_api、serialize_lc_object、serialize_messages_tuple、strip_data_url_image_blocks。

store模块提供get_store、make_store、reset_store、store_context。

stream_bridge模块提供StreamBridge、MemoryStreamBridge、StreamEvent、StreamGap、StreamItem、END_SENTINEL、HEARTBEAT_SENTINEL、make_stream_bridge。

全部在__all__里。

它有一条重要注释。

注释说明RedisStreamBridge故意不重导出。

理由是redis是可选依赖。

在这里导入会让每个进程都加载redis.asyncio。

需要时从deerflow.runtime.stream_bridge.redis导入。

## 三、它和谁协作

它向内聚合checkpoint_state、checkpointer、runs、serialization、store、stream_bridge六个模块。

它向外被app.gateway消费。

网关的thread_runs路由通过它管理运行。

它下面挂着checkpointer、checkpoint_cache、events、runs、store、stream_bridge等子包。

它还与deerflow.agents协作。

run_agent调用代理工厂构建的图。

## 四、重要性评级

评级是9分。

理由如下。

它是运行时的总门面。

run_agent、RunManager、RunStatus是全系统执行代理运行的必经API。

序列化、存储、流桥接、checkpoint四大能力在这里一次到齐。

RedisStreamBridge不重导出的注释是可选依赖管理的范例。

扣分点在于它完全不做懒加载。

导入它要连带全部运行时模块。

对网关进程这个代价必然要付。
