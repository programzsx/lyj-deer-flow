# deerflow.runtime-档案

## 一、这个包是干什么的

这个包是DeerFlow的"运行时核心"包。

包名是`deerflow.runtime`。源码在`backend/packages/harness/deerflow/runtime/`。

大白话讲。DeerFlow的后端跑一个LangGraph智能体。这个包负责智能体运行时的全部基础设施。它管运行的生命周期。它管检查点（checkpoint）的安全访问。它管事件流（streaming）。它管运行事件的记录。它管序列化。它管用户上下文和密钥上下文。

这个包是`deerflow-harness`框架包里最核心的子包之一。Gateway的`/api/langgraph/*`路由最终落到这个包的代码上。`make dev`、Docker、生产模式都通过`RunManager`加`run_agent()`加`StreamBridge`跑智能体。这三者都在这个包里或由这个包的门面导出。

这个包的`__init__.py`是门面。它重新导出`runs`子包和`stream_bridge`子包的公开API。消费者可以直接`from deerflow.runtime import RunManager, run_agent`。

## 二、包里的主要成员

### 1、__init__.py（门面）

它重新导出五个模块的公开符号。

- 检查点状态。`CheckpointStateAccessor`、`build_state_mutation_graph`。
- 检查点器工厂。`checkpointer_context`、`get_checkpointer`、`make_checkpointer`、`reset_checkpointer`。
- 运行管理。`RunManager`、`RunRecord`、`RunStatus`、`RunContext`、`run_agent`、`ConflictError`、`CancelOutcome`等。
- 序列化。`serialize`、`serialize_channel_values`、`serialize_channel_values_for_api`等。
- 事件存储工厂。`get_store`、`make_store`、`reset_store`、`store_context`。
- 流桥。`StreamBridge`、`MemoryStreamBridge`、`StreamEvent`、`END_SENTINEL`等。

一个刻意的例外。`RedisStreamBridge`没有被重新导出。`redis`是可选依赖。在这里导出它会让每个进程都加载`redis.asyncio`。需要它的地方应该从`deerflow.runtime.stream_bridge.redis`导入。

这个包下还有一个`stream_bridge/`子目录。流桥负责把LangGraph的流事件桥接成SSE事件。流桥不在本次24包清单里，但它是runtime的正式成员。

### 2、cancellation.py（取消安全）

这个模块处理异步取消的"排空"问题。

核心函数三个。

- `wait_for_task_until()`。等待一个任务完成。期间调用方可以被反复取消。任务本身不被取消。超过截止时间返回False。
- `drained_async_context()`。异步上下文管理器包装器。进入的上下文由它持有。退出时要等`__aexit__`彻底结束。调用方取消不会打断清理。清理失败不会被隐藏。
- `_drain_context_exit()`。内部辅助。用`asyncio.shield`保护退出任务。

为什么需要这个。Gateway在取消一个运行时。底层资源（数据库连接池、流桥、存储）的清理必须完成。如果调用方的取消信号打断了清理。资源就会泄漏。这个模块让清理"跨界"安全。

### 3、checkpoint_mode.py（检查点双模式）

这个模块实现检查点通道模式的安全性。模式有两种。`full`模式存完整快照。`delta`模式用LangGraph 1.2的`DeltaChannel`。delta模式存储量随轮数线性增长，不是平方增长。

模式在构建智能体时进程级冻结。冻结函数是`freeze_checkpoint_channel_mode()`。运行中的进程不能换模式。尝试换会抛`CheckpointModeReconfigurationError`。想换模式要改配置再重启。

delta模式的快照节奏由`snapshot_frequency`控制。它也随模式一起冻结。它是编译进图通道表的，故意不写进检查点元数据。

模式标记写在检查点元数据里。键是`deerflow_checkpoint_channel_mode`。没有标记等于full。所以老检查点不需要迁移。

兼容性是不对称的、fail-closed。full模式进程打开delta线程会抛`CheckpointModeMismatchError`。因为full模式裸读delta blob会静默拿到空的`messages`。反过来delta模式进程可以透明读full检查点。所以full到delta是平滑迁移路径。

### 4、checkpoint_state.py（检查点状态访问器）

这个模块定义`CheckpointStateAccessor`。它是线程检查点状态读写的唯一咽喉点。

它绑定三样东西。编译图（带模式匹配的通道schema）。检查点器。冻结的通道模式。

每次操作先做两件事。把模式标记注入config。跑兼容性门禁。然后才碰状态。

为什么不能绕过它。delta检查点不存完整的`channel_values`。裸调saver的`get_tuple`只会看到哨兵（sentinel）。必须通过accessor物化状态。

`build_state_mutation_graph()`编译一个"只写状态"的图。它只有一个空节点。入口即终点。检查点机制和主图相同。但不调度任何待办节点。所以写完的头是空闲的。不会重新触发智能体。这个图用于回滚恢复和上下文压缩这类整体状态替换。

### 5、context_compaction.py（手动上下文压缩）

这个模块实现手动线程上下文压缩。对应`POST /api/threads/{id}/compact`端点。

核心函数是`compact_thread_context()`。流程如下。

- 通过accessor读取当前快照。拿到checkpoint_id。
- 从检查点元数据解析服务器写入的agent绑定。`context_keys.py`里的`deerflow_agent_name`键。
- 解析压缩用的模型。优先级对齐lead agent的解析顺序。
- 创建`DeerFlowSummarizationMiddleware`。压缩没有消息时返回`compacted=False`。
- 用`acompact_state()`压缩。总结LLM失败会抛`ContextCompactionFailed`。
- 用`Overwrite`写回`messages`和`summary_text`。节点名是`manual_compaction`。

设计要点。压缩使用的agent和记忆策略来自检查点元数据里的服务器绑定。不是请求里的`agent_name`。绑定缺失或无效时fail-closed。可选的记忆刷写被跳过。压缩本身可以继续用默认模型。

### 6、context_keys.py（私有上下文键）

这个模块定义runtime各组件共享的私有键。

- `CURRENT_RUN_PRE_EXISTING_MESSAGE_IDS_KEY`。本次运行前已存在的消息id。
- `CHECKPOINT_AGENT_NAME_METADATA_KEY`。检查点元数据里的agent绑定键。默认值哨兵是`__default__`。这个哨兵故意不是合法的自定义agent名。所以缺失或非法的旧值不会被误认成默认agent。不会意外授权记忆写入。
- `PROJECT_CONTEXT_KEY`。运行的服务器端项目快照。客户端永远不能提供它。

辅助函数`checkpoint_agent_binding_metadata()`。从持久化检查点元数据复制agent绑定。供状态重写用。缺失或畸形值保持未绑定。记忆写入fail-closed。

### 7、converters.py（OpenAI格式转换）

这个模块是纯函数集合。把LangChain消息对象转成OpenAI Chat Completions格式的字典。

- `langchain_to_openai_message()`。单条消息转换。human变user。ai变assistant。tool消息带`tool_call_id`。带tool_calls的assistant消息按OpenAI规范处理。
- `langchain_to_openai_completion()`。完整的completion响应形状。带usage和finish_reason。
- `langchain_messages_to_openai()`。批量转换。

模块docstring说明。这个模块目前没有接进`RunJournal`。`RunJournal`直接用`message.model_dump()`。它是给需要OpenAI线上格式的消费者准备的工具。

### 8、goal.py（目标循环）

这个模块实现Claude Code风格的目标循环原语。目标是一个线程范围的目标状态。运行结束后一个小模型评估目标是否达成。未达成就隐藏续跑。

主要成员分组如下。

- 命令解析。`parse_goal_command()`解析`/goal`斜杠命令。空显示状态。`clear`/`reset`/`off`清除。其他设置目标。TUI和IM渠道共用。前端有并行的TypeScript副本。
- 状态构造。`build_goal_state()`创建新的活跃目标。`normalize_goal_objective()`校验目标文本。上限4000字符。
- 评估。`evaluate_goal_completion()`问一个非思考模型目标是否达成。可见证据不足时直接fail-closed返回`missing_evidence`。评估器在`runs/worker.py`里主图运行完之后调用。它必须自带模型级tracing回调。因为没有图根可继承。
- 决策。`should_continue_goal()`决定是否再来一个隐藏续跑轮。只有`goal_not_met_yet`这一种blocker可续跑。续跑次数和无进展次数都有上限。
- 无进展检测。`latest_visible_assistant_signature()`取最近可见助手回复的SHA-256。`compute_no_progress_count()`在证据没有前进时递增计数。键用类型化的blocker加证据签名。所以评估器换措辞不会骗过检测。
- 续跑输入。`make_goal_continuation_message()`构造隐藏的用户消息。带`hide_from_ui`标记。
- 检查点读写。`read_thread_goal()`和`write_thread_goal()`直接操作检查点的`goal`通道。写的时候把新检查点挂到它来源的检查点上。不断开祖先链。断开祖先会破坏delta回放。写前用`expected_checkpoint_id`做乐观并发检查。冲突抛`GoalWriteConflict`。
- 并发。`goal_thread_lock()`用`AsyncKeyedLockTable`按线程序列化读改写序列。

### 9、journal.py（运行事件日志）

这个模块是`RunJournal`。它是LangChain回调机制和可插拔`RunEventStore`之间的桥梁。文件约6.2万字节。它是runtime里第二大的代码文件。

`RunJournal`继承`BaseCallbackHandler`。每个运行实例化一个。它做五类事。

- 事件捕获。`on_chain_start`在根调用时发`run.start`。`on_chain_end`在根结束时发`run.end`。`on_chain_error`发`run.error`。
- 消息捕获。`on_chat_model_start`是提取第一条用户消息的规范位置。消息在这里是完全结构化的。不会被检查点裁剪压缩。它同时调和已消费的中间件工具结果。`on_llm_end`发`llm.ai.response`。`on_tool_end`持久化`ToolMessage`为`llm.tool.result`。
- token统计。内存里累计总token。按调用方分桶（lead_agent/subagent/middleware）。按模型分桶。带prompt缓存命中数。LangChain可能对同一个run_id触发两次`on_llm_end`。第一次没有usage。第二次带usage。所以按run_id去重。usage元数据进入事件前做深快照。因为provider可能原地改写响应对象。
- 工具结果调和。中间件可以自己回答工具调用并短路执行。LangChain就不会发`on_tool_end`。结果不会进事件存储。用户运行中看到了这个结果。重载后消失（issue #4666）。`_reconcile_final_tool_messages()`在根结束时补写这些结果。范围由三个独立条件限定。结果必须用户可见。调用必须属于本次运行的lead agent。结果必须还没持久化过。
- 历史种子。`build_branch_history_seed_events()`把继承的分支历史序列化成事件行。每个检查点轮一个合成run（`{前缀}-{n}`）。新轮从每条持久化的用户消息开始。`run_id`在这里是"轮"的身份。一次分支重建会通过轮的run_id删除被取代的行。一个共享id会删掉全部继承历史（issue #4458）。所以一行一轮。

其他公开能力。`record_middleware()`记录中间件状态变更事件。跨线程调用会调度到属主事件循环。`claim_tool_promotions()`原子认领工具提升名。防止并行Send重复发事件。`record_memory_context()`记录隐藏上下文指纹。只存SHA-256，不存内容。`record_delivery()`缓冲终态投递事件。`get_completion_data()`返回累计数据。`feed_generation`属性是线程流成功写入的单调计数。读者用它判断缓存的"查无此消息"答案是否值得重问。`close()`释放运行范围引用。带flush时保留状态让失败的终态写可以重试。

### 10、keyed_lock.py（按键锁表）

这个模块提供按key序列化的锁。不保留空闲的key。

两个类互为镜像。

- `AsyncKeyedLockTable`。给asyncio调用方。每个事件循环有自己的条目。因为`asyncio.Lock`竞争后会绑定到循环。线程锁只保护注册表。异步临界区不持线程锁。
- `KeyedLockTable`。给工作线程的阻塞临界区。

关键设计是参与者计数。取锁前计数加一。包括当前持有者和排队等待者。这样条目在最后一个持有者或等待者离开前一直可发现。新调用方不能建第二把锁绕过已排队的等待者。被取消的等待者通过同一个finally路径把计数还回去。最后的参与者离开时条目被回收。空闲key不会累积。

### 11、secret_context.py（请求范围密钥）

这个模块集中管理运行上下文里的密钥载体。对应issue #3861。

调用方在`config.context.secrets`里传请求级密钥。值不进提示词。不进工具参数。不进执行的命令字符串。只有当激活的技能在frontmatter里声明了`required-secrets`时。值才作为环境变量注入技能的沙箱子进程。

主要成员如下。

- `extract_request_secrets()`。取调用方提供的密钥映射。只保留字符串键值对。畸形载体不会崩掉解析。
- `read_active_secrets()`。取当前激活技能已解析的密钥。bash工具用它构建子进程环境。
- `REDACTED_CONTEXT_KEYS`。必须在可观察序列化面（trace、日志）上剥掉的键集合。
- `redact_secret_context_keys()`和`redact_config_secrets()`。返回剥掉密钥键的浅拷贝。运行配置会被原样存到运行记录（`runs.kwargs_json`）并被运行API回显。所以这两个函数是持久化和回显前的守卫。
- `validate_run_metadata_secrets()`。拒绝旧的`auth_token`元数据字段。提示改用`config.context.secrets`。

### 12、serialization.py（规范序列化）

这个模块是LangChain和LangGraph对象序列化的唯一事实来源。

- `serialize_lc_object()`。递归序列化。支持Pydantic v2和v1。特判LangGraph的`Interrupt`。它是`__slots__`类。没有`model_dump`。直接str会产生畸形载荷。
- `serialize_channel_values()`。序列化通道值。剥掉`__pregel_*`内部键。故意保留`__interrupt__`。LangGraph SDK要从values块检测中断事件（issue #3595）。
- `strip_data_url_image_blocks()`。从`hide_from_ui`消息里删掉`data:`方案的`image_url`块。历史端点会把检查点消息返回给前端。旧版本线程检查点里藏着base64图片载荷。这些是内部模型上下文。不应该上线。巨大响应体，无UI价值。
- `serialize_channel_values_for_api()`。组合前两者。所有返回通道值的REST端点用这个。
- `serialize()`。按模式分发。`messages`模式处理`(chunk, metadata)`元组。`values`模式走API序列化。

消费者是`runs/worker.py`（SSE发布）和`app.gateway.routers.threads`（REST响应）。

### 13、stream_modes.py（流模式）

这个模块定义公开的运行流模式。类型是`RunStreamMode`。支持七种。`values`、`messages-tuple`、`updates`、`debug`、`tasks`、`checkpoints`、`custom`。

- `normalize_stream_modes()`。归一化并校验。None默认`["values"]`。不支持的值抛`UnsupportedStreamModeError`。没有静默回退。
- `to_langgraph_stream_modes()`。把公开模式映射到`graph.astream`模式。`messages-tuple`映射成LangGraph的`messages`。没有静默回退。

### 14、user_context.py（用户上下文）

这个模块持有请求范围的用户上下文。核心是一个`ContextVar`。Gateway的auth中间件认证成功后设置它。仓储方法通过哨兵默认参数读它。路由不用写`user_id`样板。

仓储`user_id`参数有三态语义。

- `AUTO`（模块私有哨兵，默认）。从contextvar读。未设置时抛`RuntimeError`。
- 显式字符串。用提供的值。覆盖contextvar。
- 显式None。不加WHERE子句。只给迁移脚本和管理CLI用。它们故意绕过隔离。

`CurrentUser`定义成`Protocol`。任何有`.id: str`属性的对象都满足。这样`persistence`层不用导入`gateway.auth`的具体`User`类。依赖方向保持干净。

asyncio语义。`ContextVar`在asyncio下是任务本地的。不是线程本地。每个FastAPI请求跑在自己的任务里。所以上下文天然隔离。`asyncio.create_task`和`asyncio.to_thread`继承父任务上下文。

还有两个解析函数。`resolve_config_user_id()`从LangGraph/Gateway运行配置解析用户。服务器拥有的LangGraph认证字段优先于普通`user_id`值。`resolve_runtime_user_id()`是工具和中间件的用户id唯一事实来源。解析顺序五级。server_info的认证用户。LangGraph认证config键。runtime.context的user_id。ContextVar。`DEFAULT_USER_ID`（值为`default`）兜底。持久化用户范围状态的工具必须调这个。不能直接调`get_effective_user_id()`。

## 三、它和谁协作

### 1、上游

- `deerflow.config`。提供`AppConfig`、`CheckpointChannelMode`、快照频率默认值等配置。
- `deerflow.agents`。提供`thread_state`的schema、`goal_state`类型、中间件、`human_input`读取。
- `deerflow.persistence`。postgres schema辅助。仓储层反向依赖本包的`user_context`。
- `deerflow_extension_api`。扩展契约。goal评估器和worker调用扩展观察器。
- LangChain和LangGraph本体。回调、消息、检查点器、图。

### 2、下游（被谁用）

- `app.gateway`。几乎所有路由和`services.py`。运行、检查点、压缩、事件分页都从这里拿能力。
- `app.channels`。IM渠道集成。共享用户上下文和运行路径。
- `app.scheduler`、`app.mcp_tasks`。调度和MCP任务走同样的运行准入。
- `deerflow.client`。嵌入式客户端复用同样的运行时。
- `deerflow.tui`。终端界面用sync检查点器路径。
- 子包。`runs/`、`events/`、`checkpoint_cache/`、`checkpointer/`、`stream_bridge/`都是本包的组成部分。

### 3、依赖方向

这个包属于harness层。harness永远不导入app层。这个边界由`tests/test_harness_boundary.py`在CI里强制执行。goal.py的docstring明确说明了这一点。它故意放在`deerflow`里。让harness可以评估和续跑运行。不用导入FastAPI应用。

## 四、重要性评级

评级是10分。

理由如下。

这个包是DeerFlow后端的核心路径。Gateway的每一次运行。每一条消息流。每一个检查点。每一条SSE事件。都经过这个包的代码。

它被引用的地方非常多。全仓库搜索`from deerflow.runtime`的导入（含子包）有823处（不含runtime自身）。只看app层和harness层非runtime的文件。直接引用`deerflow.runtime`符号的文件超过40个。几乎覆盖`app/gateway`全部路由、所有IM渠道、调度器、MCP任务服务、嵌入式客户端、lead agent。

它支撑的功能是产品的主干。运行准入、取消、回滚、双模式检查点、目标循环、事件记录、用户隔离。这些不是可选功能。是每个请求都会走的功能。

删除它会怎样。Gateway直接无法启动。智能体运行时完全消失。整个产品只剩REST壳。

它的代码量大。仅`journal.py`约6.2万字节。`goal.py`约2.4万字节。加上其他模块和五个子包。它是harness里最重的子包之一。

为什么是满分不是9分。它同时满足三个条件。被海量引用。位于每次请求的核心路径。删除等于产品不可用。子包各自承担的复杂度（双模式安全、取消排空、事件调和）也说明设计上不可替代。
