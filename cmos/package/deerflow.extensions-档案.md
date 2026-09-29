# deerflow.extensions-档案

## 一、这个包是干什么的

这个包是DeerFlow的"Python插件系统"包。

包名是`deerflow.extensions`。源码在`backend/packages/harness/deerflow/extensions/`。

大白话讲。第三方Python包可以提供一个`install(registry, config)`函数。DeerFlow加载这个函数。插件通过它注册自己的贡献。贡献可以是中间件、生命周期观察者、Gateway服务、HTTP路由、模型工具等等。

这个包管三件事。

第一件事是管理。安装、升级、启用、禁用、删除一个插件包。这是命令行操作。

第二件事是加载。启动时读配置。按顺序加载插件。构造一个不可变的运行时快照。

第三件事是运行时接线。把插件贡献的中间件合并进agent的中间件栈。把失败隔离开。把生命周期事件通知出去。

公共契约在另一个包里。那个包是`deerflow-extension-api`。这个包是宿主侧实现。公共包永远不导入deerflow。这个包实现加载、注册、注入、钩子点。

信任边界写在根AGENTS.md里。插件的`plugins:`列表是操作员控制的代码执行边界。插件代码以Gateway权限执行。只有可信的操作员来源能进这条路径。

## 二、包里的主要成员

这个包有20个文件。按功能分组讲解。

### 1、管理组：manager.py和cli.py

`manager.py`是最大最复杂的模块。约50KB。`ExtensionManager`拥有包和配置的事务。

- `install()`。安装一个插件源。先要确认（`yes=True`）。因为安装会执行可信第三方代码。然后验证源。本地目录会被快照复制到`backend/extensions/sources/<distribution>/`。远程源只接受HTTPS。然后跑三个uv命令。`uv add`更新依赖声明和锁文件。审计锁里的本地引用。`uv sync --locked`同步环境。最后发现入口点并写配置。
- `upgrade()`。替换已安装的源。保留私有配置和enabled状态。
- `remove()`。先停用配置。再`uv remove`。再删快照。
- `set_enabled()`。只改enabled标志。保留私有配置。
- `list_configured()`。按加载顺序列出配置的插件。

manager的事务设计非常细致。

- 失败回滚。pyproject.toml和uv.lock被快照。失败时恢复。恢复后再做一次同步。恢复同步自己失败也要报告原始失败。
- 并发外部编辑被检测。恢复时发现依赖文件被并发编辑过就保留那个编辑并报错。remove在这种情况下把插件留在停用状态。
- 取消跳过恢复同步。声明已经恢复。下次锁定启动同步会校正环境。
- 跨进程锁。`.deer-flow/extension-manager.lock`。Windows用msvcrt。POSIX用fcntl。Windows的非阻塞模式要重试。阻塞模式十秒就放弃。
- 环境变量控制。uv命令丢弃一批UV_开头的环境覆盖。包括UV_PYTHON和UV_INSECURE_HOST。这些覆盖可能改变解释器或移除TLS校验。
- 配置文件重写是原子的。临时文件加rename。plugins块的边界来自YAML解析器而不是正则。重复的plugins键被拒绝。

`cli.py`是操作员命令行。从`deerflow`控制台脚本分发。命令有install、upgrade、list、enable、disable、remove。install要交互确认或`--yes`。

### 2、加载组：loader.py和registry.py

`loader.py`做配置驱动的加载。

- `ExtensionSpec`。`plugins:`列表的一个条目。字段有enabled、name、package、use、host_access、config、required、table_prefix。extra是forbid。
- `load_extensions()`。解析并安装每个插件。默认fail-open。坏的插件被跳过并记诊断。`required: true`翻转成fail-closed。加载失败中止启动。
- `_compatible()`。extension-api版本兼容检查。单向窗口。1.0之前同major.minor。1.0之后只要求major相同。
- `Diagnostic`。最小诊断结构。级别加来源加消息。

table_prefix在加载前无条件注册。即使插件被禁用或加载失败。因为它命名的表可能已经存在。注册错一个前缀会污染整个alembic过滤器。这种情况总是中止启动。

`registry.py`做注册阶段的登记。

- `ExtensionRegistry`。可变的登记表。插件只看到只写的公共契约。宿主实现额外拥有归属、回滚、不可变投影。
- `LoadedExtensions`。不可变的运行时视图。每个条目带来源字符串。预计算了has_标志。零插件路径不构造任何东西。
- `mark()`/`rollback_to()`。位置回滚。不用按来源删除。两个spec可以共享同一个use字符串。
- 八种贡献。middleware、task_lifecycle、system_model_observer、agent_assembly_observer、context_compaction_observer、service、routers、plugin。
- `plugin()`。注册实验性的全栈插件。校验工具名、动作名、浏览器模块、命名空间唯一性。

### 3、接线组：injection.py、isolation.py、anchors.py、stack.py、ordering.py

`isolation.py`做失败隔离。`IsolatedMiddleware`包装每个插件中间件。插件中间件在LangChain调用链里执行。未处理异常会中止用户的run。包装器让观察失败降级为诊断。调用继续通过。包装器镜像内部中间件的完整接口。包括钩子、工具、状态schema、transformer。单侧的wrap钩子得到静默直通对端。handler被跟踪。插件不能多调或漏调下游handler。

`anchors.py`做语义位置到具体索引的转换。它是唯一知道中间件栈形状的模块。`PlacementAnchor`是一条锚点规则的回退链。主锚点缺席时用备选并报警告。

`stack.py`是最终组合点。锚点表写在这里。五个位置。MODEL_LOGICAL在重试循环外层。MODEL_PHYSICAL在每个lead请求变换的内层。TOOL_VISIBLE在最外层。TOOL_RAW尽量贴近工具调用。STANDARD在重试循环外。锚点表惰性解析。`compose_with_extensions()`在构建器最后调用。不能在基础构建器里调用。因为lead构建器之后还会追加中间件。

`ordering.py`做顺序不变量校验。手写索引比较被替换成声明式约束。约束在中间件合并之后校验。插件贡献不能溜过不变量。破坏不变量是系统里唯一的硬失败。缺失观察只丢观测，顺序破坏产生错误行为而无报错。

`injection.py`把贡献的中间件合并进宿主栈。按声明顺序加注册顺序排序。从最内层位置开始插入。同名冲突加后缀。生成来源溯源图。

### 4、通知组：notify.py

`notify.py`做fail-open的通知助手。

- `notify_agent_assembled()`。agent装配完成时通知观察者。同步。按注册顺序。
- 生命周期通知。lead run和subagent用`on_task_start`/`on_task_stop`对。
- 系统模型调用观察。覆盖不经过中间件包装的DeerFlow自有模型调用。包括goal评估、记忆提取、标题生成、摘要。
- `notify_context_compacted()`。上下文压缩观察。同步。fire-and-forget。

fail-open由失败的来源决定。不是由异常基类决定。`CancelledError`到达contributor的except有两个原因。宿主任务被取消（必须传播）。contributor自己抛的（必须遏制）。只有前者会增加`asyncio.Task.cancelling()`计数。

### 5、Gateway组：gateway.py、policy.py、run_evidence.py、model_access.py、model_invocation.py、model_schema_worker.py、plugin_tools.py、browser_assets.py

`gateway.py`约26KB。做app级贡献的Gateway侧接线。贡献路由挂在宿主AuthMiddleware之后。宿主保留路径和auth豁免路径是保留的。路由冲突被保守匹配器证明。证明不了的允许挂载。WebSocket贡献路由被拒绝。`start_services()`/`stop_services()`管理服务生命周期。停止按注册逆序。每个停止有独立超时。

`policy.py`做宿主策略的插件投影。`project_host_policy()`把token预算和subagent上限投影成公共的`HostPolicySnapshot`。

`run_evidence.py`做公共只读run证据契约的宿主适配器。游标是scope绑定的。scope指纹编进游标。游标换scope就无效。生产Gateway注入全局可见的reader。用户贡献路由必须用按principal绑定的reader。

`model_access.py`做操作员授权和服务生命周期绑定。`ModelInvocationGrant`声明角色到模型的映射和并发限制。一个install拥有一个预算。即使它注册多个服务。

`model_invocation.py`做宿主拥有的模型构造、有界调用、中立投影。schema检查和输出校验在隔离的Python子进程里跑。取消会杀掉并回收子进程。调用返回纯文本、用量、可选的已校验JSON。永远不返回原始模型对象或provider异常链。

`model_schema_worker.py`是那个子进程。一次调用一个进程。管道只传有界JSON输入和固定状态词。

`plugin_tools.py`让统一插件参与普通工具装配和授权路径。插件工具名带哈希后缀。schema必须是内联对象。禁止`$ref`和保留参数。

`browser_assets.py`做浏览器资源的启动快照。单文件4MB。整包16MB。最多256个文件。

### 6、__init__.py

宿主侧入口。定义进程级单例和ContextVar。

- `get_loaded_extensions()`。进程级已加载插件。
- `bind_agent_build_extensions()`。把快照绑定到同步图装配。
- `resolve_run_extensions()`。从运行上下文取快照。类型检查过。上下文是调用方可合并的。
- `EXTENSION_SNAPSHOT_CONTEXT_KEY`。双下划线前缀的宿主内部键。Gateway会剥离调用方伪造的`__`键。
- 运行时诊断的规范收集点。上限1000条。

## 三、它和谁协作

### 1、上游调用方

- `app.gateway.app`。create_app加载插件、存快照、挂路由、装诊断列表。
- `app.gateway.deps`。启动和停止服务、run证据reader。
- `app.gateway.routers.plugins`。插件描述符、哈希JS资产、动作调用。
- `deerflow.agents.lead_agent.agent`。装配时调用`compose_with_extensions()`和`get_agent_build_extensions()`。
- `deerflow.subagents.executor`。子agent绑定快照。
- `deerflow.runtime.runs.worker`。发布快照到运行上下文。
- `deerflow.tools.builtins.task_tool`。读取运行快照。
- 中间件们。summarization、title、tool_receipt、tool_error_handling。压缩观察、系统模型调用观察、顺序约束。

### 2、下游依赖

- `deerflow-extension-api`。公共契约包。这个包实现它。
- uv。安装、移除、同步。
- yaml、tomllib、packaging。配置和元数据解析。
- `deerflow.reflection`。resolve_variable解析入口点。
- `deerflow.persistence.migrations._env_filters`。表前缀注册。
- `deerflow.models`。模型调用走普通工厂。

### 3、示例

`examples/deerflow-extension-example`和`deerflow-extension-bookmarks`是示例插件。`examples/deerflow-extension-jev-context`和`jev-classify`也引用这个包。

### 4、测试

测试覆盖非常大。大约45个测试文件引用这个包。loader、manager、registry、injection、isolation、ordering、stack、gateway、notify、model_invocation、plugin_tools、browser_assets每个模块都有专门测试文件。

## 四、重要性评级

评级是9分。

理由如下。

引用数量查证结果。全仓库约80个以上文件引用`deerflow.extensions`。其中生产代码约25处。测试约45个文件。是这5个包里被引用最多的。

这个包是插件机制的整个宿主侧。没有它就没有Python插件能力。Gateway的create_app、deps、plugins路由直接依赖它。agent装配的中间件合并走它。子agent的快照绑定走它。

它的设计约束非常严格。公共契约包不许导入deerflow。这个包不许在模块作用域导入agents.middlewares。依赖方向靠惰性解析维护。这些约束写进了多处注释和守则。

删除它会怎样。Gateway的app.py、deps.py、plugins.py无法导入。lead_agent、subagents、多个中间件的导入失败。系统完全无法启动。插件功能、路由贡献、模型调用授权、浏览器资源全部消失。

为什么是9分不是10分。它管理的功能本身是可选的。`plugins:`列表默认是空的。零插件时，`inject_middlewares`直接返回原栈。`load_extensions`返回空注册表。核心对话能力不经过它。但是它的接线代码在导入链上是硬依赖。大量宿主文件直接import它。所以它是"结构上核心、功能上可选"。综合考虑给9分。
