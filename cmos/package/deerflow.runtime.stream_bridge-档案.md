# deerflow.runtime.stream_bridge-档案

## 一、这个包是干什么的

这个包是流事件的桥梁。

一个运行由后台任务驱动。
驱动智能体的任务是生产者。
推送SSE给浏览器的HTTP端点是消费者。
生产者和消费者必须解耦。

`StreamBridge`就是中间的桥。
生产者把事件发布到桥上。
消费者从桥上订阅事件。
这个架构对齐LangGraph平台的Queue加StreamManager模式。

桥支持三种能力。

- 正常事件投递。每个事件带单调递增的id。
- 断线重连。客户端带着Last-Event-ID回来，从缓冲区重放。
- 心跳。空闲时发送心跳哨兵，保持连接活跃。

这个包提供两个实现。
默认实现是进程内的内存桥。
可选实现是基于Redis Streams的桥。
Redis桥支持多进程部署。

## 二、包里的主要成员

### （一）模块base.py——抽象协议

#### 1、数据类

`StreamEvent`是单个流事件。
它有三个字段。
id是单调递增的事件id。
id用作SSE的id字段，支持断线重连。
event是SSE事件名。
例如metadata、updates、events、error、end。
data是可JSON序列化的载荷。

`StreamGap`表示"订阅者的游标无法完整重放"。
它带三个字段。
requested_event_id是重连游标或最近投递的事件。
earliest_available_event_id是缓冲区里最早可用的事件。
latest_available_event_id是最晚可用的事件。
调用方根据保留边界重载持久状态。
调用方在当前尾部续读。
调用方不会把部分重放误当成完整重放。

#### 2、哨兵和类型别名

`HEARTBEAT_SENTINEL`是心跳哨兵。
事件名是`__heartbeat__`。

`END_SENTINEL`是结束哨兵。
事件名是`__end__`。

`StreamItem`是类型别名。
它是StreamEvent或StreamGap的联合。

#### 3、StreamBridge抽象类

抽象类定义四个核心操作。

- `publish`把一个事件入队给某个run。
- `publish_end`标记某个run不会再有事件。
- `subscribe`返回异步迭代器。空闲超过心跳间隔就发心跳哨兵。生产者结束就发结束哨兵。订阅者落后于保留历史就发StreamGap并停止。
- `cleanup`释放某个run关联的资源。支持延迟释放，给晚到的订阅者排干的机会。

抽象类还有一个`supports_cross_process`属性。
内存桥是False。
Redis桥是True。
这个属性告诉部署方桥能不能跨进程工作。

心跳间隔有校验。
间隔必须是正的有限数。
间隔不能超过配置的上限。
非法值抛ValueError。

### （二）模块memory.py——内存桥

#### 1、MemoryStreamBridge类

内存桥为每个run保留一份事件日志。
事件保留在有界的窗口内。
晚到的订阅者和重连的客户端可以从Last-Event-ID重放。

每个run有独立的`_RunStream`。
`_RunStream`持有事件列表、条件变量、结束标记、起始偏移。
缓冲超过上限时删除最旧的事件。
起始偏移相应前移。

#### 2、事件id的设计

事件id格式是`{毫秒时间戳}-{序号}`。
序号每次发布递增一。
所以序号等于事件在run内的绝对偏移。

`_resolve_start_offset`用算术定位重放起点。
定位是O(1)的。
它不用扫描保留缓冲区。
算出的索引会用保留id做验证。
游标低于保留水位时走保守的gap路径。
宁可让调用方重载持久状态。
也不静默宣称一次完整重放。

#### 3、订阅循环

订阅循环在条件变量上等待。
有新事件就投递。
缓冲被清理导致游标落后就发gap并停止。
生产者结束且事件读完了就发结束哨兵。
空闲超时就发心跳哨兵。

### （三）模块redis.py——Redis桥

#### 1、RedisStreamBridge类

Redis桥把每个run存在一个Redis Stream里。
订阅者直接用XREAD读。
这让SSE桥跨多个Gateway工作进程可用。
Last-Event-ID重放语义保持不变。

它声明`supports_cross_process = True`。

每个run的key带前缀。
写入用XADD并带maxlen。
maxlen对齐配置的queue_maxsize。
数据还带TTL过期。
TTL和过期在同一个事务管道里设置。

#### 2、订阅的正确性设计

阻塞的XREAD不能参与Redis事务。
所以活跃订阅者用非阻塞的原子快照保证正确性。
快照一次读出保留边界和条目。
边界检查不会和读取竞态。
另用一个阻塞读只作为唤醒信号。
这个设计每轮多花一条管道命令。
代价换来了保留边界检查的正确性。

唤醒响应有特殊处理。
第一个阻塞读开始时流被证明为空。
它的响应是临时的活跃基线，还不是客户端可见的数据。
投递前要对照保留水位验证基线。
这个处理让无游标的订阅者也拿到落后信号。

#### 3、错误恢复

瞬态Redis错误有重试。
最多连续三次。
退避是指数的，封顶在心跳间隔。
Last-Event-ID被Redis拒绝时直接失败。
拒绝不重置为0-0。
重置会重放整个保留缓冲。

### （四）模块async_provider.py——异步工厂

`make_stream_bridge`是公共异步入口。
它按配置选择桥的类型。

配置缺失或memory时用内存桥。
redis时用Redis桥。
Redis的连接串按优先级解析。
先看配置，再看`DEER_FLOW_STREAM_BRIDGE_REDIS_URL`，再看`REDIS_URL`，最后用localhost默认值。

RedisStreamBridge故意不在`__init__`里导入。
redis是可选extra。
这个包被runtime在启动时传递导入。
急切导入会让每个进程都依赖redis包。
只有`stream_bridge.type == "redis"`时才懒导入。

关闭时通过`await_drained`排干。
关闭不被调用方取消打断。

## 三、它和谁协作

上游是运行worker。
`run_agent`通过`publish`发布每个事件。
运行结束时调用`publish_end`。

下游是SSE端点。
Gateway的路由调用`subscribe`订阅事件。
订阅结果逐条推给浏览器。

配置系统决定桥的类型。
`stream_bridge_config`提供类型和参数。

它和checkpointer、Store的工厂风格一致。
都是异步上下文管理器。

## 四、重要性评级

评级：8分。

理由如下。

这个包是流式体验的骨干。
Gateway的SSE推送完全依赖它。
没有它，前端看不到任何运行过程。

它是核心路径。
每次运行的每个事件都经过桥。
断线重连、心跳、落后检测都定义在这里。

它被引用的面相对集中。
约8个文件直接引用这个包。
主要集中在runtime和Gateway端点。

它有两个实现，可靠性要求高。
内存桥的正确性在于偏移算术和gap检测。
Redis桥的正确性在于原子快照和唤醒处理。
删除它，流式功能瘫痪。
运行仍然能完成，但用户看不到过程。
