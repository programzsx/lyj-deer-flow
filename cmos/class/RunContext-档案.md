# RunContext档案

源码位置：backend/packages/harness/deerflow/runtime/runs/worker.py

## 一、这个类是干什么的

RunContext是单个agent运行的基础设施依赖集合。

RunContext把一次运行需要的所有单例依赖打包成一个对象。

打包的目的是让run_agent收到一个对象。而不是一串越来越长的关键字参数。新依赖加入时只加字段。不改调用签名。

RunContext包含checkpointer、存储、事件存储、配置、扩展快照等依赖。

RunContext是不可变的。类声明用了frozen=True。一次运行期间依赖不会变。

RunContext由宿主层构建。构建完成后传给run_agent。run_agent从ctx解包依赖。

## 二、类的成员

（一）字段

- `checkpointer`：LangGraph检查点存储。保存线程状态。必填。
- `store`：可选的长期存储。
- `event_store`：可选的运行事件存储。用于运行事件持久化。
- `run_events_config`：可选的运行事件配置。
- `thread_store`：可选的线程存储。
- `mcp_task_repo`：可选的MCP任务仓库。
- `app_config`：解析后的应用配置。工具可以用它。不用环境全局查找。
- `extensions`：本次运行的扩展快照。任务委派绑定同一个生成。不会读到运行中被替换的单例。
- `checkpoint_channel_mode`：checkpoint通道模式。full或delta。默认full。
- `checkpoint_snapshot_frequency`：delta快照频率。启动时冻结。None表示本进程没有冻结。解析到配置默认值。
- `on_run_completed`：可选的运行完成回调。
- `conversation_reader`：宿主绑定的会话读取能力。绑定到本次运行的认证读者和引用。

（二）方法

RunContext是frozen dataclass。RunContext没有自定义方法。

## 三、它和谁协作

（一）run_agent

run_agent是RunContext的主要消费者。run_agent从ctx解包所有依赖。

（二）宿主层

Gateway的langgraph运行时构建RunContext。嵌入式的DeerFlowClient也构建RunContext。

（三）依赖单例

RunContext字段引用checkpointer、各store、app_config等单例。这些单例的实际类型是Any。构建方负责注入正确类型。

## 四、重要性评级

评级：6分。

理由：RunContext是运行依赖的集合载体。它让run_agent的签名稳定。新依赖不用改调用方。checkpoint模式、扩展快照、会话读取能力全靠它传递。它本身没有逻辑。但它承载了运行的基础设施。所以给6分。
