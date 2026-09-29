# deerflow.config.stream_bridge_config-档案

## 一、这个模块是干什么的

这个模块管理流桥的配置。

流桥连接代理工作器和SSE端点。

代理运行的事件要推送给前端。

单进程部署用内存事件日志。

多worker的Docker部署用Redis Streams。

这个配置决定用哪种后端和连接参数。

## 二、模块里的主要成员

### 1、StreamBridgeConfig类

`type`选后端，默认memory。

`redis_url`是redis连接地址。

省略时按顺序读`DEER_FLOW_STREAM_BRIDGE_REDIS_URL`、`REDIS_URL`，最后用本地默认。

`queue_maxsize`是每次运行保留的事件数上限，默认256。

`heartbeat_interval_seconds`是流心跳的间隔，默认15秒。

SSE客户端、非流式等待请求、内部订阅者都用这个间隔。

`max_connections`是redis连接池的上限。

每个活着的SSE客户端占一个连接，阻塞在XREAD上。

几百个并发客户端就是几百个连接。

不设置用redis-py默认（实际上限）。

`stream_ttl_seconds`是redis流键的滚动TTL，默认86400秒。

每次发布后刷新TTL。

保证重放缓冲最终被回收。

`recovered_stream_cleanup_delay_seconds`是恢复的孤儿运行在发布END标记后等多久删流键。

默认60秒。

给重连的SSE客户端时间读完结束信号。

### 2、布尔拒绝

校验器拒绝布尔值的心跳间隔。

pydantic会把布尔静默转成浮点。

显式拒绝让配置错误暴露。

## 三、它和谁协作

`app_config.py`的`stream_bridge`字段是这份配置。

这个字段是启动专用的。

流桥单例在启动时构造一次。

## 四、重要性评级

评级：6分。

理由：流桥是前端实时看到运行进度的通道。redis连接上限和TTL是多worker部署的关键参数。布尔拒绝的校验是细致的防御。
