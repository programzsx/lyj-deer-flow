# deerflow.runtime.stream_bridge.async_provider-档案

## 一、这个模块是干什么的

这个文件是流桥的异步工厂。

它提供异步上下文管理器。和检查点的异步工厂对齐。

主要调用方是FastAPI lifespan。Gateway启动时用它创建桥。

它把配置解析成流桥实例。无配置时回退到memory桥。

## 二、模块里的主要成员

### 1、_resolve_config

这个函数解析流桥配置。

app_config是None时读全局的流桥配置。否则用app_config.stream_bridge。

配置是None时查环境变量。DEER_FLOW_STREAM_BRIDGE_REDIS_URL有值时构建redis配置。

### 2、_resolve_redis_url

这个函数解析redis地址。

顺序是配置里的redis_url。然后DEER_FLOW_STREAM_BRIDGE_REDIS_URL。然后REDIS_URL。最后默认redis://localhost:6379/0。

### 3、make_stream_bridge

这是工厂的异步上下文管理器。

它yield一个StreamBridge。

决策逻辑是这样的。

配置缺失或type是memory时。创建MemoryStreamBridge。传入容量和心跳间隔。finally里用await_drained关闭桥。

type是redis时。创建RedisStreamBridge。传入redis地址、容量、心跳间隔、最大连接数、流TTL。finally里关闭。

其他类型抛ValueError。

关闭用await_drained。调用方取消不能打断桥的关闭。

配置里的启动专用字段是heartbeat_interval_seconds。订阅时显式传入的间隔覆盖它。

## 三、它和谁协作

它依赖config里的StreamBridgeConfig。

它依赖runtime.stream_bridge.base里的StreamBridge。

它依赖runtime.stream_bridge.memory和redis两个实现。

它依赖deerflow.utils.file_io里的await_drained。

它被Gateway的FastAPI lifespan调用。

## 四、重要性评级

评级是4分。

理由是这个文件是流桥的装配入口。

配置到环境变量到memory的回退链让部署配置简单。

关闭排空保证桥的清理不被取消打断。

不评高分是因为它只是装配逻辑。桥的核心行为在base、memory、redis三个文件里。
