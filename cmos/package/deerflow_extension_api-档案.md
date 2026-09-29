# deerflow_extension_api-档案

## 一、这个包是干什么的

这个包是DeerFlow扩展系统的"公共契约"包。

包名是`deerflow_extension_api`。源码在`backend/packages/extension-api/deerflow_extension_api/`。

这个包对应一个独立发布的Python发行包。发行包名字叫`deerflow-extension-api`。当前契约版本是`0.2.4`。

它的核心使命只有一条。它定义扩展插件与宿主之间的全部约定。

这条使命有一个铁律。这个包绝对不能导入`deerflow`。

文档字符串写得很清楚。扩展需要的每一个宿主契约都放在这里。框架相关的导入留给扩展自己作为直接依赖。这样扩展可以脱离宿主独立发版。

大白话讲。扩展插件想接入DeerFlow，就必须遵守这里的规矩。但扩展不需要安装整个DeerFlow框架。扩展只需要安装这个轻量的契约包。

## 二、包里的主要成员

包一共有15个代码文件。每个模块负责一类契约。

### 1、contracts.py

这个模块定义扩展契约的主体。

- `extension`。声明扩展的入口装饰器或函数。
- `ExtensionRegistry`。扩展注册表契约。
- `ExtensionInstall`。扩展安装信息。
- `ExtensionRuntimeDeps`。宿主注入的运行时依赖。
- `ExtensionService`。扩展可以贡献的Gateway服务契约。
- `MiddlewareContributor`。扩展贡献中间件的契约。
- `TaskLifecycleContributor`。扩展观察任务生命周期的契约。
- `SystemModelCallObserver`。系统级模型调用观察者。
- `HostPolicySnapshot`。宿主策略快照。

这个模块有明确的兼容性规则。每个Protocol方法都带默认实现。每个可选dataclass字段都带默认值。这样后续新增方法对已发布的扩展保持增量兼容。

### 2、plugins.py

这个模块定义插件的可选贡献物。

- `PluginContribution`。统一贡献入口。
- `BackendAction`。后端动作。后端动作跑在Gateway进程里。
- `BrowserModule`。浏览器模块。
- `ModelTool`。模型工具。
- `ActionContext`、`ToolContext`。动作与工具的上下文。
- `BrowserAssets`。浏览器资源。

### 3、assembly.py

这个模块定义"智能体是由什么组装出来的"。

- `AgentAssemblyDescriptor`。智能体组装描述符。记录渲染后的提示词哈希、授权工具、中间件顺序。
- `AgentAssemblyObserver`。组装观察者。
- `MiddlewareDescriptor`、`ToolDescriptor`。中间件与工具的描述。

设计动机很直白。中间件只看得见邻居，看不见提示词。运行器只看得见图，看不见图的输入。所以工厂必须在组装时把描述符一起发出来。

### 4、placement.py

这个模块定义扩展中间件在宿主中间件栈里的位置。

- `Placement`。位置枚举。
- `MiddlewarePlacement`。位置声明。
- `AgentBuildContext`、`AgentScope`。构建上下文与作用域。

设计思想是语义保证优先。扩展声明"我需要观察原始工具返回"，而不是声明"把我放在第3层"。宿主保留重组自己栈的自由。

### 5、model_invocation.py

这个模块定义宿主授予扩展的文本模型调用能力。

- `ModelInvoker`。模型调用器协议。
- `ModelInvocationRequest`、`ModelInvocationResult`、`ModelMessage`、`ModelUsage`。请求、结果、消息、用量。
- `ModelInvocationError`及子类。规范化错误。错误里不含提供商异常或凭证。

### 6、auth.py

这个模块定义扩展贡献路由的身份识别。

- `resolve_principal`、`ExtensionPrincipal`。主体解析与主体。
- `require_admin`、`require_plugin_management`、`arequire_plugin_management`。权限守卫。

设计动机。贡献的路由在安装时就构建了，那时还没有任何请求。所以宿主把解析器装到`app.state`上，这个模块在请求期读回来。这里用鸭子类型而不是Starlette的Request类型。因为契约包不能依赖web框架。

### 7、provenance.py

这个模块定义消息的生产者标记。

- `MessageProvenance`。消息来源。
- `MESSAGE_PRODUCER_KIND_KEY`等常量。标记用的键。
- `provenance_kwargs`、`read_provenance`。写入与读取。

设计动机。中间件链会注入和改写消息。日期提醒、召回记忆块、压缩摘要都是注入物。等这些消息到达模型调用边界，生产者已经无法从消息本身还原。所以生产中间件必须自己盖戳。

值用普通字符串而不是枚举成员。这样新版宿主的新生产者只会退化成未知字符串，不会引起导入错误。

### 8、compaction.py

这个模块定义上下文压缩事件契约。

- `ContextCompactionObserver`。压缩观察者。
- `CompactionEvent`。压缩事件。

压缩是破坏性的。N条消息被一条摘要替换。之后没人能回答"哪些消息变成了这条摘要"。所以必须在映射还存在的地方发出来。

字段用规范内容哈希做键。因为宿主目前不给消息发稳定身份键。

### 9、release.py

这个模块定义影响行为的参数声明。

- `ReleasePolicyProvider`。发布策略提供者。
- `collect_release_policies`。收集策略。
- `canonical_json`、`canonical_hash`。规范化JSON与哈希。

设计思想。两次运行"同一个智能体"，只有中间件链执行了同样的限制、提示词、阈值，才算真的相同。每个中间件自己声明哪些参数影响行为。声明就是契约，声明背后的属性可以随便改。

### 10、run_evidence.py

这个模块定义稳定的只读运行证据契约。

- `RunEvidenceReader`。运行证据读取器。
- `RunStatusView`、`RunPage`、`RunEventPage`、`RunEventView`。状态视图与分页。
- `require_run_evidence_reader`、`resolve_run_evidence_reader`。获取与守卫。

### 11、runtime_bridge.py

这个模块桥接LangGraph运行时上下文与任务作用域存储。

- `EXTENSION_TASK_STORE_KEY`。宿主所有的键。扩展不许直接写运行时上下文。
- `task_store_from_runtime`。从运行时取任务存储。

### 12、state.py

这个模块定义按作用域交给扩展的类型化存储。

- `ExtensionData`。扩展私有状态。按类型做键而不是按字符串做键。这样两个扩展不会撞键。宿主在每个作用域创建一个实例，作用域结束就丢弃。

### 13、settings.py与settings相关

- `SettingsField`。声明式非敏感部署参数。值由部署安装的插件提供，不支持在线编辑。

## 三、它和谁协作

### 1、上游消费方

宿主一方。`app/gateway/app.py`、`app/gateway/services.py`、`app/gateway/routers/plugins.py`导入它来装配扩展。

框架一方。`deerflow.agents.assembly_descriptor`、`deerflow.agents.lead_agent.agent`、`deerflow.agents.memory.manager`、多个中间件都导入它。

注意一个细节。`lead_agent/agent.py`里的`LeadAgentAssembly`故意把descriptor的类型写得很松。因为那个模块在LangGraph Server启动时被导入，不能把契约包拉进导入路径。

### 2、下游依赖

它几乎不依赖任何东西。它只依赖Python标准库。这正是它的设计目标。

### 3、扩展一方

示例扩展`examples/deerflow-extension-{example,bookmarks}`依赖它。测试夹具`backend/extension_test_fixtures/`也依赖它。

### 4、测试

`tests/test_extension_api_contracts.py`、`test_extension_api_state.py`、`test_extension_api_surface.py`直接测试这个包。

## 四、重要性评级

评级是7分。

理由如下。

这个包是扩展生态的宪法。没有它，第三方扩展无法与宿主对话。

它被约20个文件引用。宿主装配层、框架层、示例扩展都依赖它。

它的独立性是特性。它不依赖deerflow。删除它不会破坏核心智能体运行。核心智能体不经过扩展也能跑。

删除它会怎样。扩展系统整体失效。所有第三方插件无法加载。Gateway的插件路由崩溃。但核心对话能力保留。

为什么不是更高分。它服务的是扩展这条可选路径。核心路径不经过它。

为什么不是更低分。它承载版本化契约。契约一旦发布就要长期兼容。它的设计质量直接决定扩展生态的稳定性。
