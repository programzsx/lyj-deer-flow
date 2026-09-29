# RedisStreamBridge-档案

## 一、这个类是干什么的

RedisStreamBridge是runtime/stream_bridge/redis.py里的类。

它继承StreamBridge。

它是Redis Streams支撑的per-run流桥。

每个run存在一个Redis Stream。

订阅者直接用XREAD读。

这让SSE桥跨多个gateway worker进程可用。

同时保留Last-Event-ID重放语义。

supports_cross_process为True。

这个类位于backend/packages/harness/deerflow/runtime/stream_bridge/redis.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造方法

redis_url、queue_maxsize、key_prefix。

stream_ttl_seconds默认86400。一天。

每个活的SSE订阅者持有一个池化连接阻塞在XREAD。

max_connections控制池大小。

client参数可注入供测试。

### 2、XREAD批量

_XREAD_COUNT是64。

每往返读多条。

大Last-Event-ID重放折叠成远更少的调用。

live tailing仍逐事件yield。

消费循环在end标记处中批返回。

### 3、订阅重试

_MAX_SUBSCRIBE_RETRIES是3。

subscribe期间容忍最多3个连续transient Redis错误。

ConnectionError、TimeoutError等。

短暂抖动用指数退避重试。上限heartbeat_interval。

超过后错误传播给调用方。

### 4、redis lazy导入

redis是可选extra。

镜像persistence/engine.py的postgres和asyncpg路径。

这个模块从make_stream_bridge lazy导入。

只在stream_bridge.type为redis时。

提示在请求Redis桥而没有包时surfaced。

make dev下次自动从config.yaml检测并重装。

或切换到memory模式。单进程部署。

### 5、事件id

_REDIS_STREAM_ID_RE匹配Redis流id。

Redis流id原生单调。

Last-Event-ID直接是Redis流id。

重放语义天然。

### 6、其他

KIND_EVENT和KIND_END区分事件和结束。

END_SENTINEL和HEARTBEAT_SENTINEL来自基类。

stream TTL防止死run的流堆积。

## 三、它和谁协作

- StreamBridge是基类契约。
- run worker发布事件。
- SSE消费者跨进程订阅。
- make_stream_bridge按配置选择桥。

## 四、重要性评级

评级是6分。

理由如下。

这个类是多进程流桥的实现。

Redis Streams原生单调id。重放语义天然。

XREAD批量折叠重放。

订阅重试带指数退避。

stream TTL防堆积。

supports_cross_process。

这些是多worker部署流可靠性关键。

扣掉4分。

扣分原因是它是可选Redis实现。
