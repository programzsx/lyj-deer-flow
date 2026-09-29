# deerflow.tracing-档案

## 一、这个包是干什么的

这个包是追踪系统的核心。

智能体的执行过程需要被观测。
一次运行里有节点调用。
有LLM调用。
有工具调用。
追踪系统把这些记录成trace。
追踪帮助开发者理解行为。
帮助定位问题。
帮助统计令牌用量。

这个包支持三个追踪提供者。

- LangSmith。通过环境变量启用。
- Langfuse。通过环境变量启用。
- Monocle。通过环境变量启用。

三个提供者的接线方式不同。
LangSmith和Langfuse是LangChain回调。
Monocle是进程级的全局遥测。

## 二、包里的主要成员

### （一）模块__init__.py——公共出口

导出四个公共函数。

- `build_tracing_callbacks`。构建回调。
- `build_langfuse_trace_metadata`。构建Langfuse元数据。
- `inject_langfuse_metadata`。注入元数据。
- `setup_monocle_tracing_if_enabled`。启用Monocle。

### （二）模块factory.py——回调工厂

#### 1、build_tracing_callbacks函数

这个函数返回LangChain的CallbackHandler列表。
只为当前启用的提供者返回回调。
启用的判定来自环境变量。
例如LANGSMITH_TRACING、LANGFUSE_TRACING。

`_create_langsmith_tracer`创建LangSmith tracer。
LangSmith是纯回调。
创建`LangChainTracer`。

`_create_langfuse_handler`创建Langfuse回调。
langfuse版本4通过客户端单例初始化项目凭据。
先创建`Langfuse`客户端。
凭据来自配置。
再创建`LangfuseCallbackHandler`。

#### 2、回调附加的位置

回调附加在图调用根。
`make_lead_agent`和`DeerFlowClient.stream`都把回调加进`config["callbacks"]`再调用图。
一次运行产生一个trace。
所有节点、LLM、工具调用都是子span。

独立调用者保留模型级附加。
不在这种图里调用模型的调用者。
例如`MemoryUpdater`。
`create_chat_model`的默认`attach_tracing=True`回退到模型级回调附加。

#### 3、Monocle的特殊性

Monocle不是回调提供者。
它安装进程全局的OTel TracerProvider。
一次性副作用。
所以它从Gateway lifespan初始化。
从不从`build_tracing_callbacks()`初始化。

`build_tracing_callbacks`只读取Monocle的setup完成标记。
用来提示嵌入式和TUI进程。
提示它们启用了MONOCLE_TRACING但没跑Gateway lifespan的setup。

### （三）模块metadata.py——Langfuse元数据

#### 1、build_langfuse_trace_metadata函数

这个函数构建Langfuse保留的trace属性。
属性给`RunnableConfig.metadata`。
Langfuse v4的回调把这些属性提升到根trace。
提升只在`on_chain_start(parent_run_id=None)`时发生。
所以回调必须在图根。

字段映射是这样的。

- `langfuse_session_id`。来自LangGraph的thread_id。
- `langfuse_user_id`。来自`get_effective_user_id()`。无认证时是default。子代理从task_tool时的runtime.context捕获。
- `langfuse_trace_name`。来自RunRecord的assistant_id或客户端的agent_name。默认lead-agent。子代理用`subagent:<name>`。
- `langfuse_tags`。环境标签加模型标签。
- `deerflow_trace_id`。来自deerflow.trace_context的当前入口trace id。总是写。总是等于同一个Gateway请求返回的X-Trace-Id。不被配置门控。

Langfuse不在启用的提供者里时返回空字典。
只有LangSmith的部署不受影响。

#### 2、inject_langfuse_metadata函数

运行worker和客户端把元数据合并进`config["metadata"]`。
合并在模型选择后、调用图前。
子代理执行器对每个子代理运行做同样的事。
子代理trace归到父线程的会话卡片下。
调用方提供的key用setdefault获胜。
外部的session_id覆盖被保留。

### （四）模块monocle.py——Monocle遥测

#### 1、setup_monocle_tracing_if_enabled函数

这个函数在MONOCLE_TRACING设置时初始化Monocle遥测。
否则无操作。

它调用`monocle_apptrace.setup_monocle_telemetry()`。
安装进程全局的OTel TracerProvider。
补丁span序列化。
自动instrument openai、langchain、langgraph客户端。

这是一次性、进程全局的副作用。
不是per-run回调。
所以只从Gateway lifespan调用。
从不从`build_tracing_callbacks()`调用。
`import deerflow.agents`绝不开始追踪。
由测试钉住。

它默认关闭。
Gateway lifespan是唯一调用点。
嵌入式`DeerFlowClient`和TUI不被instrument。
嵌入式用户要Monocle trace就在运行agent前自己调用它。

`monocle_apptrace`自己防重复setup。
从不强制覆盖已有的全局provider。
所以这个包装只是配置门控的薄层。

#### 2、setup完成标记

`is_monocle_setup_completed`读取setup是否跑过。
标记是模块级的。
`build_tracing_callbacks`读它来提示嵌入式进程。

#### 3、DeerFlow注入的属性

DeerFlow不往Monocle trace里注入per-run字段。
唯一的属性是`workflow_name="deer-flow"`。
每个span属性由Monocle自己的metamodel和自动instrument产生。
所以这里没有DeerFlow的trace属性层要维护。

#### 4、共存

与Langfuse共存是验证过的。
两个都是OTel基础。
第二个初始化的库复用已有的全局TracerProvider。
附上自己的span processor。
任何一方都不丢span。
两个processor看到所有span。
LangSmith是普通回调，共存是平凡的。

#### 5、配置

配置是env驱动的。
`MONOCLE_TRACING`启用它。
`MONOCLE_EXPORTERS`选择exporter。
默认file。
trace JSON在`.monocle/`目录。
也有console、okahu、s3、blob、gcs。
okahu需要OKAHU_API_KEY。

## 三、它和谁协作

上游是三个接线点。

- `make_lead_agent`。图根附加回调。
- `DeerFlowClient.stream`。图根附加回调，合并元数据。
- Gateway lifespan。初始化Monocle。

子代理执行器合并元数据。
每个子代理trace归到父线程的会话卡片下。

下游是三个提供者。

- LangSmith。LangChainTracer。
- Langfuse。LangfuseCallbackHandler。
- Monocle。OTel TracerProvider。

它和trace_context协作。
`deerflow_trace_id`来自trace_context。
总是等于X-Trace-Id。

它和配置系统协作。
`get_tracing_config`提供配置。
env变量驱动。

## 四、重要性评级

评级：7分。

理由如下。

这个包是可观测性的入口。
没有它，运行没有trace。
调试和统计失去工具。

它被引用面中等。
约16个文件直接引用这个包。
主要集中在智能体工厂、客户端、运行worker。

它不是运行的核心路径。
trace失败不影响运行正确性。
追踪是辅助能力。
默认关闭，env驱动启用。

它有三个提供者。
LangSmith和Langfuse是per-run回调。
Monocle是进程级遥测。
两种接线方式都在这里。

它承载了trace元数据契约。
Langfuse字段映射。
deerflow_trace_id。
这些是跨系统的观测契约。

删除它，追踪功能消失。
Langfuse会话卡片、trace标签、用户统计都失效。
但运行不受影响。

所以给7分。
