# assemble_lead_agent-档案

## 一、这个类是干什么的

assemble_lead_agent不是类。

assemble_lead_agent是agents/lead_agent/agent.py里的模块级函数。

这个函数是主代理的装配函数。

它返回编译好的lead图和装配描述符。

Gateway worker用这个显式装配结果。

装配描述不需要从LangGraph私有runtime键或可变的图属性里恢复。

make_lead_agent是图-only的LangGraph Server入口。

这是lead代理装配的核心。

它处理模型解析、授权、模式冻结、工具组装、中间件链、系统提示和装配描述。

这个模块位于backend/packages/harness/deerflow/agents/lead_agent/agent.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、LeadAgentAssembly数据类

这是frozen的数据类。

字段包括graph、descriptor、effective_model。

descriptor类型故意宽松。

原因是这个模块在LangGraph Server启动时导入。

不能把扩展契约包拉进导入路径。

### 2、assemble_lead_agent函数

这个函数是主入口。

流程如下。

第一步合并runtime配置。

第二步选择checkpoint模式。

模式选择优先级如下。

第一次冻结时app config拥有进程模式。客户端提供的configurable键被忽略。这样直接的LangGraph请求不能重新配置或搞崩新进程。

冻结后内部注入的键或app config必须匹配冻结模式。任何不匹配fail closed。伪造的键或config.yaml变化不能悄悄重新配置进程。

快照节奏随模式一起冻结。restart-required。不能被客户端注入。

第三步解析权威用户身份。

第四步解析模型名、计划模式、子代理开关、bootstrap标志、交互策略、agent_name。

第五步加载代理配置并解析memory开关。

第六步解析thinking和reasoning。

优先级是请求、自定义代理默认、运行时默认。这对应issue #4336。

第七步解析模型配置和reasoning契约。

请求按模型的reasoning契约归一化。必需thinking的模型把开关打开。不支持的模型关掉。受限的effort词汇映射到provider自己的。

第八步注入run metadata。包括agent_name、model_name、thinking_enabled、subagent_enabled、tool_groups、mcp_plugins、available_skills、allowed_subagents、memory_enabled。

第九步在图调用根注入tracing回调。单个LangGraph运行产生一个trace。所有节点、LLM、工具调用都是子span。Langfuse handler能传播langfuse_session_id和langfuse_user_id。

第十步构建技能搜索setup。

第十一步区分bootstrap代理和普通代理。

bootstrap代理有最小提示。技能集合故意窄。只有bootstrap技能。这样自定义代理自己的配置存在之前代理创建保持确定性。

普通代理解析update_agent的可用性。webhook通道的运行不给update_agent。webhook提示来自任意外部评论者。任何能在配置的repo发帖并@机器人的人都会触发。在那里暴露这个工具会给评论者修改tool_groups、SOUL.md、model的路径。变更对所有后续运行持久。自变异属于操作员可信表面。

第十二步组装工具。包括conversation reader的条件开启。

第十三步授权工具。

第十四步装配延迟工具和MCP路由中间件。

第十五步构建中间件链和系统提示。

第十六步create_agent创建图。

第十七步_complete_assembly构建描述符。

### 3、_authorize_model_name函数

这个函数强制model:use授权。

authorization未启用时是no-op。

启用时解析的模型通过authorize("model", "use")检查。

拒绝时优雅回退到第一个filter_resources允许的模型。

RFC第9节。回退到允许的默认，不报错，避免破坏运行。

没有模型允许且fail_closed时抛ValueError。

fail-open返回原名。

### 4、build_middlewares函数

这个函数构建lead代理的完整中间件链。

这是公开入口。

make_lead_agent和内嵌DeerFlowClient都用它。

中间件链的顺序有讲究。

ThreadDataMiddleware在SandboxMiddleware之前。

SummarizationMiddleware在早期。

TodoListMiddleware在ClarificationMiddleware之前。

ViewImageMiddleware在ClarificationMiddleware之前。

ToolErrorHandlingMiddleware在ClarificationMiddleware之前。

ClarificationMiddleware最后。

SafetyFinishReasonMiddleware在terminal-response和自定义中间件之后注册。

LangChain的after_model按逆序派发。所以Safety先跑。

SystemMessageCoalescingMiddleware把所有SystemMessage合并成一个前导的。

严格后端拒绝非前导SystemMessage。

子代理并发解析一次。

是每运行请求、启动冻结的容量、schema安全上限三者的最小值。

### 5、_resolve_runtime_option函数

这个函数按请求、代理配置、默认值的优先级解析运行时选项。

用key in cfg而不是cfg.get(key)。

区分"请求省略了字段"和"请求设为假值"。

请求提供的thinking_enabled: false被尊重。

### 6、_complete_assembly函数

这个函数描述完成的图并把描述交给观察者。

递归限制在这里折入。

没有观察者注册时完全跳过描述构建。

描述构建会哈希每个工具的描述和JSON schema。

每个装配都是真实工作。

### 7、unwrap_agent_graph函数

这个函数解包lead assembly。

Gateway工厂返回LeadAgentAssembly。

第三方或测试工厂可能返回裸图。

用类型检查而不是duck-typing。

两个契约都有效。

## 三、它和谁协作

- build_middlewares构建中间件链。
- apply_prompt_template构建系统提示。
- get_available_tools和assemble_deferred_tools组装工具。
- apply_tool_authorization授权工具。
- resolve_authorization_provider和build_principal_from_context做模型授权。
- checkpoint_mode模块冻结模式。
- tracing模块注入回调。
- resolve_run_interaction_policy解析交互策略。
- load_agent_config加载自定义代理配置。

## 四、重要性评级

评级是10分。

理由如下。

这个函数是lead代理装配的总入口。

Gateway和内嵌客户端的所有代理构建都经过它。

它处理了模式冻结、身份解析、模型授权、thinking优先级、reasoning契约、工具授权、webhook防护、装配描述。

checkpoint模式冻结防止伪造键重新配置进程。

model:use授权让运行时和Gateway路由契约一致。

webhook通道不给update_agent是真实的攻击面防护。

交互策略和中间件链顺序都有明确理由。

它是整个代理系统的装配核心。

满分10分。
