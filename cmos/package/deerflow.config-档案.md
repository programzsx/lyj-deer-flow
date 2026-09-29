# deerflow.config-档案

## 一、这个包是干什么的

这个包是DeerFlow的"配置系统"包。

包名是`deerflow.config`。源码在`backend/packages/harness/deerflow/config/`。

大白话讲。整个系统要运行，需要读一堆配置。这个包定义所有配置的模式。这个包负责加载、缓存、校验这些配置。

配置有两个来源。

第一个是`config.yaml`。这是主应用配置。模型、沙箱、工具、记忆、摘要、子智能体都写在这里。

第二个是`extensions_config.json`。这是扩展配置。MCP服务器和技能状态写在这里。这两个文件在仓库根目录。都是gitignore的。都可以在运行时通过网关API修改。

这个包的`__init__.py`导出最常用的入口。`get_app_config`、`get_extensions_config`、`get_paths`、`get_memory_config`等。

这个包是纯harness代码。它不导入app层。app层反而大量导入它。

## 二、包里的主要成员

配置文件按域分组讲。

### 1、应用主配置

- `app_config.py`。这是包里最大的成员。约4万字节。`AppConfig`类是全部主配置的聚合根。它聚合40多个配置块。每个块对应一个子系统。加载入口是`get_app_config()`。它缓存解析结果。它检测配置路径或文件内容签名变化后自动重载。`AppConfig.from_file()`做版本对比。用户版本落后于示例版本就发警告。`recursion_limit`和`max_recursion_limit`是热重载的。每个网关运行都读。
- `extensions_config.py`。`ExtensionsConfig`类。MCP服务器、技能状态、配置声明的中间件都在这里。这个模块还有原子写助手`atomic_write_extensions_config`。用临时文件加改名。Linux在挂载点上拒绝改名时退回原地覆盖。还有原始读写助手`read_raw_extensions_config`、`set_raw_skill_enabled`。运行时写入方从不把模型序列化回磁盘。原因是解析后的值会把密钥明文持久化。
- `paths.py`。`Paths`类。集中式路径配置。定义整个应用数据的目录布局。基目录解析顺序是构造参数、`DEER_FLOW_HOME`环境变量、项目根下的`.deer-flow`。布局里有用户桶。`users/{user_id}/`下有用户档案、自定义智能体、自定义技能、线程数据。线程数据挂载为沙箱里的`/mnt/user-data`。这个模块还有`make_safe_user_id`。它把外部身份规范化成安全字符集。有损清洗加SHA-256哈希后缀，防止不同原始ID合并进同一个存储桶。
- `reload_boundary.py`。配置热重载边界的唯一事实来源。`STARTUP_ONLY_FIELDS`列出所有重启才生效的字段。数据库、沙箱、日志、调度器等。这些字段在启动时被快照一次。改了YAML要重启才生效。`format_field_description`生成标准化的`"startup-only:"`前缀。IDE悬停就能看到原因。测试`test_reload_boundary.py`双向固定这个注册表。
- `file_signature.py`。共享内容签名助手。运行时可编辑配置文件用它检测变化。签名包含文件元数据和内容摘要。对象存储或网络挂载上mtime可能停滞。内容摘要让网关和LangGraph的读取保持对齐。
- `runtime_paths.py`。独立harness用法的运行时路径解析。

### 2、模型与LLM域

- `model_config.py`。`ModelConfig`。LLM配置。`use`类路径、思考支持、视觉支持、提供商字段。可选的`reasoning`块声明思考可用性。还有进程本地模型节流`request_admission`。严格整数字段用`BeforeValidator`转换字符串形式的十进制字面量。
- `managed_models.py`和`managed_model_providers.py`。管理员托管模型。和YAML分离。加密目录在运行时主目录里。
- `circuit_breaker.py`域（在`app_config.py`里）。`CircuitBreakerConfig`。LLM断路器配置。连续失败阈值和恢复超时。
- `llm_call`域（在`app_config.py`里）。`LlmCallConfig`。LLM调用执行配置。并发上限、重试参数。并发上限是启动时冻结的。

### 3、agent与子智能体域

- `agents_config.py`。智能体配置。
- `agent_storage_config.py`。自定义智能体定义存储配置。文件或数据库后端。
- `agents_api_config.py`。自定义智能体管理API配置。
- `acp_config.py`。ACP（Agent Client Protocol）智能体配置。
- `subagents_config.py`。子智能体委托配置。默认每次运行最多6个。钳制在1到50。
- `subagent_runtime_config.py`。启动时的进程容量配置。普通和批处理子智能体共享。
- `subagent_batches_config.py`。持久子智能体批处理调度配置。默认关闭。
- `suggestions_config.py`。后续建议配置。
- `projects_config.py`。用户项目配置。

### 4、记忆域

- `memory_config.py`。`MemoryConfig`。记忆系统配置。启用开关、存储路径、防抖、模型、事实数、置信度阈值、注入配置、陈旧审查配置。共享模式刻意保持精简。这是后端可换和可移植的关键。DeerMem的专属参数不泄漏到共享契约上。
- `blob_storage_config.py`。内容寻址blob存储配置。只含宿主共享字段。后端私有字段在各自后端的`backend_config`里。

### 5、沙箱与工具域

- `sandbox_config.py`。`SandboxConfig`。沙箱提供商配置。所有权类型、溢出策略、网络模式。Redis租约TTL校验保留符号64位毫秒范围的一半，给相对TTL转绝对时间戳留余量。
- `tool_config.py`。`ToolConfig`和`ToolGroupConfig`。工具和工具组配置。
- `tool_output_config.py`。工具输出预算保护配置。
- `tool_artifact_config.py`。持久工件句柄注册表配置。
- `tool_search_config.py`。延迟工具加载配置。
- `tool_progress_config.py`。工具进度状态机配置。
- `read_before_write_config.py`。先读后写文件闸门配置。

### 6、MCP域

- `mcp_tasks_config.py`。MCP任务轮询器的启动配置。轮询间隔、租约、并发上限、退避。
- `input_polish_config.py`。发送前输入润色配置。

### 7、存储与持久化域

- `database_config.py`。统一数据库后端。SQLite或Postgres。SQLite模式下检查点和应用共享单个`.db`文件。开启WAL模式。Postgres模式下同一个URL但独立的模式。
- `checkpointer_config.py`。LangGraph检查点配置。已废弃。向后兼容。存在时只覆盖检查点和Store。
- `run_events_config.py`。运行事件存储配置。memory用于开发。db用于生产查询。jsonl用于轻量单节点。
- `dedupe_storage_config.py`。入站webhook去重存储配置。默认auto复用Postgres应用存储。
- `postgres_schema.py`。PostgreSQL模式名的共享校验。

### 8、技能域

- `skills_config.py`。`SkillsConfig`。技能路径配置。宿主路径和容器路径。技能的延迟发现开关。
- `skill_scan_config.py`。原生技能安全扫描配置。
- `skill_evolution_config.py`。智能体管理的技能演化配置。
- `task_continuity_config.py`。可选择的线程本地工作笔记和压缩源召回配置。
- `knowledge_base_config.py`。知识库能力配置。热重载。提供商无关。提供商连接细节属于`tools[]`条目。

### 9、观测与追踪域

- `tracing_config.py`。追踪配置。LangSmith、Langfuse、Monocle等提供商。`is_tracing_enabled`等判断函数。
- `token_usage_config.py`。令牌用量追踪配置。

### 10、安全与守卫域

- `auth_config.py`。认证配置。本地加OIDC单点登录。
- `authorization_config.py`。细粒度资源授权配置。两层。装配时能力过滤加运行时执行拒绝。默认关。
- `guardrails_config.py`。工具调用前的守卫提供商配置。提供商按类路径加载。
- `pii_redaction_config.py`。PII脱敏配置。默认关。开启时要求至少16字符的`token_secret`。短密钥对低熵标识符可被暴力破解。
- `safety_finish_reason_config.py`。安全终止拦截配置。镜像守卫配置的形状。检测器按类路径加载。
- `verification_config.py`。回执账本、验收清单、选择性评判配置。
- `loop_detection_config.py`。循环检测配置。每工具频率阈值覆盖。批处理工作流可以为bash这类高频工具调高阈值。
- `token_budget_config.py`。每次运行令牌预算配置。软警告阈值和硬停止阈值。
- `summarization_config.py`。上下文摘要配置。触发条件、保留策略。默认保留策略和摘要中间件的退化回退共享常量，防止漂移。
- `title_config.py`。自动线程标题配置。
- `plugin_settings.py`。部署拥有的插件配置校验。没有在线覆盖。

### 11、通道与其他域

- `channel_connections_config.py`。用户拥有的IM通道连接配置。
- `stream_bridge_config.py`。流桥配置。
- `run_ownership_config.py`。多worker部署的运行所有权配置。租约心跳。
- `scheduler_config.py`。定时任务运行时配置。轮询间隔、租约、并发、队列超时。`recursion_limit`是个例外。它在热重载字段区里。
- `prompt_overlay.py`。操作员拥有的字面量提示词覆盖。prepend和append。不允许模板格式化。
- `typesafe_config.py`。TypeSafe（Jev）消费者共享的顶层默认值。

## 三、它和谁协作

### 1、上游

- 仓库根目录的`config.yaml`和`extensions_config.json`。这两个文件是配置的数据源。
- 环境变量。配置值以`$`开头会解析为环境变量。比如`$OPENAI_API_KEY`。
- `.env`文件。模块加载时调用`load_dotenv()`。

### 2、下游

- 全仓库几乎每个模块都依赖这个包。用Grep搜`deerflow.config`导入，有约540个文件引用。搜`get_app_config`，有约190个文件用到。
- `app/`应用层。网关路由、通道服务、定时任务服务都通过`get_app_config()`读配置。
- `deerflow.agents.middlewares`。每个中间件从config取自己的配置块。
- `deerflow.models`、`deerflow.sandbox`、`deerflow.tools`、`deerflow.skills`等所有子系统。
- 测试`tests/test_reload_boundary.py`、`tests/test_extensions_config_raw_writes.py`等固定这个包的行为。

### 3、依赖方向

依赖规则是app导入deerflow。deerflow永远不导入app。这个边界由`tests/test_harness_boundary.py`在CI里强制执行。这个包在harness层。它是被依赖的一方。

## 四、重要性评级

评级是10分。

理由如下。

这个包是整个系统的配置事实来源。没有任何一个模块能绕开它。

引用量在全仓库排最前列。用Grep搜`deerflow.config`导入，有约540个文件引用。搜`get_app_config`的使用，有约190个文件。这个数字比`deerflow.agents.middlewares`的引用量还大。

它是核心路径。网关的每个请求依赖都通过`get_app_config()`路由。热重载字段在下一轮消息就生效。基础设施字段重启才生效。边界本身由这个包定义。

删除它会怎样。所有模块的导入直接失败。网关无法启动。智能体无法创建。配置无处可读。整个后端不成立。

为什么不是9分。这个包的地位和`deerflow.agents.middlewares`并列最高。区别只在性质。这个包是声明式的。它定义系统长什么样。中间件包是行为式的。它定义系统怎么跑。两者都是删掉就全盘崩溃的级别。

为什么不是更低分。没有理由。它同时满足被引用最多、核心路径、删除即崩溃三个条件。
