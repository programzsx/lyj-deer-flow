# deerflow.agents.lead_agent-档案

## 一、这个包是干什么的

这个包是DeerFlow的"主智能体"包。

包名是`deerflow.agents.lead_agent`。源码在`backend/packages/harness/deerflow/agents/lead_agent/`。

大白话讲。整个系统里那个真正和用户对话、调用工具、委派子任务的"大智能体"，就是这里造出来的。

这个包只装两个文件。但两个文件都很大。

- `agent.py`。约6.4万字节。工厂本体。
- `prompt.py`。约5.8万字节。系统提示词本体。

`__init__.py`极简单。它只有一行，从`agent.py`导出`make_lead_agent`。

`make_lead_agent`是发布在`langgraph.json`里的入口点。它的签名和裸图返回类型必须保持不变。因为LangGraph Server直接解析这个入口。

## 二、包里的主要成员

### 1、agent.py的工厂函数

这个模块有三个层次的工厂入口。

- `make_lead_agent(config)`。发布的入口。返回图。
- `assemble_lead_agent(config, *, app_config=None)`。Gateway调用的入口。返回`LeadAgentAssembly`。
- `_make_lead_agent(config, *, app_config)`。内部实现。

- `LeadAgentAssembly`。一个冻结dataclass。装着图、描述符、生效模型三样东西。
- `unwrap_agent_graph(agent_result)`。拆包函数。Gateway工厂返回assembly。第三方或测试工厂可能返回裸图。按类型检查而不是按鸭子类型拆包，两种契约都有效。

### 2、build_middlewares()

这个函数组装中间件栈。

它导入并串联`deerflow.agents.middlewares`下的十几个中间件。

- `ClarificationMiddleware`。向用户提问。
- `LoopDetectionMiddleware`。循环检测。
- `MemoryMiddleware`。记忆捕获。
- `SummarizationMiddleware`。上下文摘要。
- `TitleMiddleware`。标题生成。
- `TodoMiddleware`。待办列表。
- `TokenUsageMiddleware`。令牌用量。
- `SubagentLimitMiddleware`。子智能体限流。
- `SafetyFinishReasonMiddleware`。安全终止。
- `ModelLengthFinishReasonMiddleware`。模型长度终止。
- `TerminalResponseMiddleware`。终态响应。
- `ViewImageMiddleware`。看图。

### 3、模型选择与授权

- `_resolve_model_name()`。解析模型名。
- `_authorize_model_name()`。授权模型名。

模型选择走`deerflow.models.create_chat_model()`。支持思考模式与视觉模式。

### 4、prompt.py的提示词系统

这个模块负责渲染主智能体的系统提示词。系统提示词由很多小节拼成。

- `apply_prompt_template()`。总装函数。生成完整系统提示词。
- `get_skills_prompt_section()`。技能小节。
- `get_agent_soul()`。智能体"灵魂"。自定义智能体的人格文本。
- `_build_subagent_section()`。子智能体小节。
- `_build_memory_tool_section()`。记忆工具小节。
- `_get_memory_context()`。从记忆管理器取注入文本。
- `_build_self_update_section()`。自我更新小节。
- `_build_acp_section()`。ACP小节。
- `_build_custom_mounts_section()`。自定义挂载小节。

### 5、技能缓存

`prompt.py`里有一套全局技能缓存。

- `get_enabled_skills_for_config()`。取启用的技能。按`(app_config, user_id)`做键缓存。LRU上限256。
- `prime_enabled_skills_cache()`。预热缓存。
- `invalidate_user_skill_cache()`。按用户失效缓存。
- `refresh_skills_system_prompt_cache_async()`。异步刷新。

缓存用后台线程加载。加载期间有版本号机制。加载完成前又发生了失效，工作线程会继续循环，保证缓存收敛到最新版本。

没有上限会怎样。长期运行的多用户进程每个用户泄漏一个条目。所以设了256的上限。

### 6、追踪回调不变量

`agent.py`文件头有一条重要不变量。

追踪回调（Langfuse、LangSmith）挂在图调用根上。本模块里每一次`create_chat_model(...)`调用，以及从这张图可达的每个中间件里的调用，都必须传`attach_tracing=False`。

忘记这个标记会怎样。产生重复span。而且阻断Langfuse处理器的`propagate_attributes`路径。`session_id`和`user_id`就到不了追踪里。

当前有五个调用点。引导智能体、默认智能体、摘要中间件、标题中间件的异步路径、技能安全扫描器。新增图内调用点必须加到清单里。

### 7、提示词信任边界

这条规则很重要。框架权威文本走system通道。用户和模型影响的文本走清洗过的`HumanMessage`数据通道。

绝不能把不受信的值插值进system文本。即使转义了标签也不能中和自然语言注入。这是PR#5090的教训。

### 8、其他守卫

- `_WEBHOOK_CHANNELS`。GitHub渠道的入站消息来自不受信的外部评论者。对应渠道的运行上下文不能授权`update_agent`这类管理工具。
- `interaction_policy`。非交互运行会排除`ask_clarification`。

## 三、它和谁协作

### 1、上游

- Gateway。`app/gateway/services.py`调用`assemble_lead_agent`。
- LangGraph Server。通过`langgraph.json`解析`make_lead_agent`。
- IM渠道。`app/channels/manager.py`触发的运行最终跑这张图。
- 内嵌客户端。`deerflow/client.py`导入`build_middlewares`和提示词函数。

### 2、下游依赖

- `deerflow.models`。造模型。
- `deerflow.agents.middlewares`。中间件栈。
- `deerflow.agents.thread_state`。状态模式。
- `deerflow.skills`。技能列表。
- `deerflow.subagents`。子智能体名单。
- `deerflow.authz`。模型与工具授权。
- `deerflow.config`。配置。
- `deerflow.tracing`。追踪回调。

### 3、测试

`tests/test_agent_assembly_descriptor.py`测试组装描述符。`tests/test_agent_display_name.py`、`test_agent_model_settings.py`、`test_custom_agent.py`、`tests/_agent_e2e_helpers.py`都围绕这个包。

## 四、重要性评级

评级是10分。

理由如下。

这个包是整个产品的"心脏"。每一次对话、每一次运行，都要经过这里造出的图。

`make_lead_agent`是发布入口。签名不能变。变了的后果是整个运行时无法解析图。

提示词从这里来。模型从这里选。中间件从这里串。工具授权从这里过滤。

删除它会怎样。产品立即死亡。没有图可运行。Gateway、渠道、客户端全部失去意义。

它被引用的地方很多。`runtime/runs/worker.py`消费它的assembly。客户端导入它的内部函数。Gateway服务层调用它。

它是核心路径上的核心路径。没有任何绕开它的方式。所以给10分。
