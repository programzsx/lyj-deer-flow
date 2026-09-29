# StreamBridgeConfig档案

一、这个类是干什么的

StreamBridgeConfig是流桥的配置类。流桥把agent worker连接到SSE端点。这个类控制流桥用什么后端。这个类还控制心跳间隔、队列大小和Redis连接数。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- type：字面量。取值是memory或redis。默认值是memory。memory用进程内事件日志。只支持单进程。redis用Redis Streams。支持多worker的Docker部署。
- redis_url：字符串或None。默认值是None。redis后端的Redis URL。省略时按DEER_FLOW_STREAM_BRIDGE_REDIS_URL、REDIS_URL或redis://localhost:6379/0的顺序取值。
- queue_maxsize：整数。默认值是256。最小值是1。这个字段是每个run保留的最大事件数。对应内存桥的队列大小或redis流的MAXLEN。
- heartbeat_interval_seconds：浮点数。默认值是15.0。大于0。上限86400。这个字段是流心跳之间的空闲秒数。适用于SSE客户端、非流式等待请求和内部订阅者。
- max_connections：整数或None。默认值是None。这个字段是redis桥连接池的最大连接数。每个活跃SSE客户端持有一个阻塞在XREAD上的连接。不设置就用redis-py的默认值。只对redis桥生效。
- stream_ttl_seconds：整数。默认值是86400。最小值是0。这个字段是Redis流键的滚动TTL。0表示禁用。只对redis桥生效。
- recovered_stream_cleanup_delay_seconds：浮点数。默认值是60.0。最小值是0。这个字段是恢复的孤儿run发布END标记后删除流键前的等待秒数。给重连的SSE客户端留出时间消费结束信号。只对redis桥生效。

（二）方法

- reject_boolean_heartbeat_interval：字段校验器。这个方法在Pydantic把布尔值强转成浮点数之前拒绝布尔值。

模块级还有get_stream_bridge_config、set_stream_bridge_config、load_stream_bridge_config_from_dict三个函数。这些函数管理模块级单例。

三、它和谁协作

AppConfig持有这个类。AppConfig的stream_bridge字段是这个类的实例。可以为None。None表示没有配置流桥。回退到带默认值的memory后端。SSE端点和worker之间的流转发代码读取这个实例。

四、重要性评级

评级：6分。

理由：流桥是SSE推送的基础。多worker部署必须配置redis后端。心跳间隔决定客户端感知连接断开的延迟。所以重要性中等偏上。
