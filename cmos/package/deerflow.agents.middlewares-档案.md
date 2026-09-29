# deerflow.agents.middlewares-档案

## 一、这个包是干什么的

这个包是DeerFlow的"中间件链"包。

包名是`deerflow.agents.middlewares`。源码在`backend/packages/harness/deerflow/agents/middlewares/`。

大白话讲。一个智能体每次和模型交互，中间要过很多道关卡。这个包提供所有这些关卡。

关卡做的事可以归成几类。

有的关卡改写输入。有的关卡改写输出。有的关卡拦截危险操作。有的关卡注入上下文。有的关卡兜底错误。有的关卡管预算。

这个包有50多个中间件模块。约84万字节。它是整个智能体运行时最重的包。

这些中间件不是散装的。它们按固定顺序串成一条链。

链的组装入口在`tool_error_handling_middleware.py::_build_runtime_middlewares`。这个函数暴露为`build_lead_runtime_middlewares`。主智能体在`lead_agent/agent.py::build_middlewares`里先调它，再追加主智能体专有的条目。子智能体在`subagents/executor.py`里用`build_subagent_runtime_middlewares`复用大部分基座。

链的顺序有讲究。输入净化在最外层。这样内层所有中间件看到的都是干净消息。回执层在最外层的工具调用包装上。因为内层的闸门可能短路调用。

包里的`__init__.py`是空的。所有中间件都从各自的模块直接导入。

包里还有两份总纲文档。`AGENTS.md`讲中间件链的完整顺序。`TOOL_ARTIFACTS.md`讲工具工件中间件的契约。

## 二、包里的主要成员

成员按功能分组讲。

### 1、安全与净化类

这组负责信任边界。坏内容不能以框架身份到达模型。

- `input_sanitization_middleware.py`。输入防线。它在链的最外层。它把用户消息里的保留XML标签转义成字面文本。比如`<system>`变成`&lt;system&gt;`。策略是"去标识而不是拒绝"。用户问怎么用`<system>`标签的问题仍然能问。注入攻击被中和。转换是请求级的。线程状态里保留原文。每个模型调用都重新中和。
- `tool_result_sanitization_middleware.py`。工具结果防线。智能体抓取的网页和搜索结果是攻击者可控的。这个中间件对第一方网络工具的结果做同样的标签中和。覆盖web_fetch、web_search、image_search、web_capture。还覆盖所有MCP来源的工具。本地工具输出不动。
- `pii_redaction_middleware.py`。PII脱敏。默认关。开启后把真实用户消息和远程工具结果里的个人身份信息改写成不可逆的占位符。用128位HMAC摘要。确定性正则检测器。带校验。卡号用Luhn。中国身份证用mod-11。密钥是部署级的`token_secret`。没有映射表。令牌不能离线还原。
- `knowledge_scope_middleware.py`。知识范围执行。它只暴露网关准入的执行范围。它从模型消息里剥除范围数据。它在功能关闭时阻止`knowledge_search`。

### 2、审计与闸门类

这组在工具执行前后设卡、记账。

- `sandbox_audit_middleware.py`。沙箱命令审计。它审计沙箱里的shell和文件操作。它按位置判断命令替换的风险。命令位置执行抓取的内容，被阻止。值位置只捕获输出，放行。heredoc体是数据。这是纵深防御和审计，不是安全边界。沙箱才是隔离边界。这个中间件无条件追加，主智能体和子智能体都有。
- `read_before_write_middleware.py`。先读后写闸门。可选。默认开。修改已存在的文件之前必须先读当前版本。读的时候在ToolMessage上盖内容哈希。写操作永远不刷新标记。写一次文件就使旧读失效。闸门检查和执行按路径串行化。
- `tool_receipt_middleware.py`和`tool_receipt.py`。工具回执。可选。默认开。它是工具调用包装的最外层。它给每个工具结果盖确定性溯源戳。工具名、状态、参数哈希、字节数、时间戳。它还在模型调用前派生隐藏回执账本。显示编号r1到rN。超预算时保留最新回执。
- `tool_progress_middleware.py`。工具进度状态机。可选。它检测停滞和重复。先警告，再阻断。它读`deerflow_tool_meta`元数据而不是解析文本。它和循环检测是独立的。
- `audit_context.py`。私有运行时上下文助手。它解析审计记录器和可信的子智能体归属。调用方提供的`is_subagent`永远不被采信。
- `tool_promotion_audit_middleware.py`。延迟工具晋升审计。它观察最终的`tool_search`调用。它按每次运行原子认领新名字，去重并行搜索。

### 3、上下文注入类

这组负责把该让模型知道的东西送进请求。

- `dynamic_context_middleware.py`。动态上下文。它注入当前日期和可选的用户记忆。静态提示词保持完全不变，这样前缀缓存可以跨用户复用。日期作为`<system-reminder>`SystemMessage注入。跨零点时注入轻量的日期更新提醒。时区默认跟随服务器，可以用`DEER_FLOW_DATE_TIMEZONE`环境变量指定IANA时区。
- `durable_context_middleware.py`。持久上下文。它在压缩前把任务委派记录和技能引用捕获进线程状态。然后把它们投影进每个模型请求。静态权威规则用SystemMessage。不可信字段值用隐藏的HumanMessage数据块。压缩历史、委派工作、活跃技能保持可见。它们不占用messages通道，也不被提升为系统指令。
- `thread_data_middleware.py`。线程数据。它创建每线程目录。布局是用户隔离范围下的`user-data/{workspace,uploads,outputs}`。身份用`resolve_runtime_user_id`解析，解析不到就退回请求ContextVar或`"default"`。
- `uploads_middleware.py`。上传注入。仅主智能体。历史文件不再每轮注入。智能体按需用`list_uploaded_files`工具发现它们。
- `view_image_middleware.py`。看图。仅视觉模型。它在模型请求里重建隐藏的base64图像上下文。它从不写进检查点状态。状态只保留轻量的`viewed_images`元数据。读图前重新检查`sandbox:execute`授权。
- `memory_middleware.py`。记忆中间件。它把对话排队给异步记忆机制。只过滤真实用户消息和最终AI回复。它捕获运行时解析的用户身份。
- `title_middleware.py`。标题。它在第一轮完整对话后自动生成线程标题。它规范结构化消息内容再喂给标题模型。
- `skill_activation_middleware.py`。技能激活。它检测最新真实用户消息里的严格`/skill-name task`语法。它只解析已启用且运行时允许的技能。它把SKILL.md正文作为隐藏的当轮上下文注入。它记录`middleware:skill_activation`审计事件。

### 4、技能与工具治理类

这组管模型能看到哪些工具、能用哪些工具。

- `skill_tool_policy_middleware.py`。技能工具策略。它只在真实激活后应用`allowed-tools`。它过滤模型可见的工具模式，阻止未授权执行。它把版本化的、绑定中间件令牌的决策存进运行时上下文。下一次模型调用总是刷新。它是行为范围控制，不是硬安全边界。
- `deferred_tool_filter_middleware.py`。延迟工具过滤。可选，`tool_search.enabled`时生效。它把还没晋升的MCP工具模式从模型绑定里藏起来。晋升状态从图状态读。按目录哈希界定范围，防止过期的持久晋升暴露漂移过的工具。
- `mcp_routing_middleware.py`。MCP路由。它根据路由元数据自动晋升匹配最新用户消息的延迟工具。不执行工具。新名字发`middleware:tool_promotion`事件。
- `artifact_capture_middleware.py`。工件捕获。它把工具结果里的轻量工件引用捕获进`ThreadState.tool_artifacts`。这是一个reducer通道，条目在摘要压缩后幸存。句柄是`art_`加8个十六进制字符。
- `artifact_resolution_middleware.py`。工件解析。模型用短句柄引用工件。工具执行前，这个中间件把句柄替换成真实引用。未知或过期句柄返回结构化错误，不执行工具。

### 5、错误兜底类

这组保证运行不会静默死掉。

- `llm_error_handling_middleware.py`。LLM错误处理。它把提供商或模型故障转换成可恢复的助手错误。带重试和退避。同步和异步调用携带断路代次所有权。只有当前所有者能结算或释放半开探测。过期的完成不能影响更新的恢复尝试。取消原样传播，不重试也不计入失败。
- `terminal_response_middleware.py`。终端响应。提供商执行完工具后返回空的终端AIMessage时，它注入隐藏恢复提示并重试一次。第二次还是空就在检查点状态里换成可见的错误回退。运行以错误结束而不是静默成功。
- `dangling_tool_call_middleware.py`。悬空工具调用修复。悬空调用是AIMessage带工具调用但没有对应ToolMessage。孤儿结果相反。两者都会让严格的提供商拒绝请求。这个中间件插入占位ToolMessage、丢弃孤儿结果、净化畸形工具名和参数。
- `tool_error_handling_middleware.py`。工具错误处理。它把工具异常转换成错误ToolMessage。运行可以继续而不是中止。它给每个结果盖`deerflow_tool_meta`结构化元数据。它还暴露链的组装入口。
- `system_message_coalescing_middleware.py`。系统消息合并。严格的推理后端拒绝非开头的系统消息。这个中间件把每条SystemMessage合并成一条开头的SystemMessage。只碰每次请求的载荷。检查点状态不变。
- `model_response.py`。模型响应助手。`last_ai_message`等纯函数。从中间件结果里取最后一条助手消息。

### 6、终止与预算类

这组负责让运行干净地停下来。

- `loop_detection_middleware.py`。循环检测。可选。它防止智能体用同样的参数无限调同一个工具。策略是滑动窗口加哈希。同一哈希达到警告阈值就注入"你在重复自己"的提醒。达到硬上限就剥掉所有工具调用，强迫模型给出最终文本回答。状态按运行界定。新用户运行获得新预算。
- `token_budget_middleware.py`。令牌预算。可选。它跟踪单次运行内累计的令牌用量。配置软警告和硬停止阈值。硬停止时从所有提供商表面剥掉工具调用。用量和警告状态按run_id界定。目标续跑共享同一个预算。
- `subagent_limit_middleware.py`。子智能体限额。可选。它截断多余的普通task调用。同时执行每响应并发上限和每次运行委派总数上限。上限耗尽时剥掉剩余调用、强制`finish_reason="stop"`、追加可见的限额说明。
- `model_length_finish_reason_middleware.py`和`model_length_termination_detectors.py`。长度终止。提供商因为输出预算耗尽而停止时，它保留可见内容、追加确定性通知、丢弃可能在输出边界被截断的工具调用。它盖`model_length_termination`标记，让下游守卫停止介入。检测器模块是策略接口加三个内置检测器。新提供商可实现接口并接线。
- `safety_finish_reason_middleware.py`和`safety_termination_detectors.py`。安全终止。提供商安全终止响应时（比如`finish_reason=content_filter`），它抑制工具执行。半截断的工具调用不能被当完整的派发。检测器模块是策略接口加三个内置检测器。
- `todo_middleware.py`。待办提醒。可选，计划模式时生效。待办列表被卷出上下文窗口时注入提醒。待办没完成时阻止智能体退出循环。它让位于`model_length_termination`。
- `clarification_middleware.py`。澄清。它拦截`ask_clarification`工具调用。写可读的ToolMessage正文加结构化的`human_input`工件载荷。然后通过`Command(goto=END)`中断运行。它必须是链的最后一个。当轮的兄弟工具调用被丢弃，防止它们在用户回答前运行。表单字段规范化是确定性的、原子的。任何结构破坏都会把整个表单降级成旧版模式。上限是16个字段、每字段24个选项、16KB序列化字节。
- `_bounded_dict.py`。有界字典。守卫中间件（令牌预算、循环检测）按run_id保存状态。这个共享实现保证两个中间件用同样的方式封顶。长寿命实例不会跨运行泄漏内存。

### 7、技能与委派的纯函数支撑

这组不是中间件。它们是中间件用的确定性捕获和渲染助手。

- `skill_context.py`。已加载技能文件的确定性捕获和渲染。
- `skill_usage.py`。技能实际加载内容的有界、只显示快照。存在产生消息上。这个元数据永远不用于工具或密钥授权。
- `delegation_ledger.py`。任务委派的确定性捕获和渲染。渲染有字符预算。终态有固定的状态短语。
- `receipt_verification.py`。引用核对。终端摘要里的`[rN]`引用对照执行记录交叉核对。纯函数。无IO，无LLM调用。词汇分层。摘要布尔值用`citation_resolved`。强肯定词保留给运行时硬闸门。
- `tool_output_synopsis.py`。超预算工具输出的类型化概要。包含文件引用。
- `tool_call_args.py`。工具调用参数的统一改写助手。一条AIMessage在四个表面上携带同样的参数。只改一个表面会留下原始载荷可达。所有模型绑定的参数改写必须用它。
- `tool_call_metadata.py`。克隆带工具调用的AI消息的助手。移除工具调用要用它，不能裸更新`tool_calls`字段。
- `tool_result_meta.py`。`deerflow_tool_meta`元数据键的规范。下游读这个键而不是解析文本。
- `tool_transform_meta.py`。工具结果变换轨迹。结果改写中间件在这里追加声明的条目。观察者按事实分类原始到可见的变换。
- `message_utils.py`。消息判断助手。`is_genuine_user_message`区分真实用户消息和系统注入的HumanMessage。
- `configured_extensions.py`。配置声明的中间件加载。`extensions_config.json`里的`middlewares`条目通过`resolve_class`实例化。导入、类、构造错误都会让智能体创建失败。

## 三、它和谁协作

### 1、上游

- `deerflow.agents.lead_agent.agent`。链的组装者。`build_middlewares`调`build_lead_runtime_middlewares`再追加主智能体条目。
- `deerflow.subagents.executor`。子智能体运行时。它调`build_subagent_runtime_middlewares`复用基座。
- `deerflow.agents.thread_state`。状态模式。`ThreadState`提供委派、技能上下文、工件、晋升等通道。
- `deerflow.config`。几乎所有中间件都从config包取自己的配置块。
- `deerflow_extension_api`。溯源戳助手。注入时用`provenance_kwargs()`盖`additional_kwargs`。
- `deerflow.subagents`。状态契约和验收检查。
- `deerflow.models.request_admission`。LLM错误处理读准入错误。

### 2、下游

- langchain和langgraph。所有中间件继承`AgentMiddleware`。挂进`wrap_model_call`、`wrap_tool_call`、`before_model`、`after_model`等钩子。
- `deerflow.tools.artifact_registry`。工件提取。
- `deerflow.runtime`。用户上下文和上下文键。
- `deerflow.utils`。自定义事件、消息助手。

### 3、测试

`backend/tests/`里有大量对应测试。命名模式是`test_<中间件名>.py`。阻塞IO严格测试在`tests/blocking_io/`下，比如`test_artifact_middlewares.py`。

## 四、重要性评级

评级是10分。

理由如下。

这个包是智能体运行时的核心路径。每一次模型调用、每一次工具执行都要过这条链。

引用量在全仓库排最前列。用Grep搜`deerflow.agents.middlewares`及相关导入，有约175个文件引用这个包。这还不算链内互引。

链的组装入口被主智能体和子智能体两个运行时调用。删掉任何一个环节都会立刻改变智能体行为。

删除它会怎样。智能体无法被创建。链的组装入口直接导入包内模块。没有安全净化、没有错误兜底、没有循环检测、没有摘要压缩。更严重的是，严格的推理后端会因为悬空工具调用直接返回HTTP 400。整个智能体产品不成立。

为什么不是9分。这个包没有再低的理由。它和`deerflow.config`并列是整个harness里被依赖最重的两个包。区别只在性质。config是每个模块都要读的配置源。这个包是运行时行为本体。两者都是10分。
