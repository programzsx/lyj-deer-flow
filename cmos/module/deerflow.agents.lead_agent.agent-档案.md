# deerflow.agents.lead_agent.agent-档案

## 一、这个模块是干什么的

这个文件是DeerFlow主智能体的装配工厂。

DeerFlow每一次对话背后的那个"超级智能体"就是在这里造出来的。

这个文件把零件组装成一个可运行的LangGraph图。

零件包括聊天模型、工具列表、中间件链和系统提示词。

这个文件还负责装配前的所有决策。

决策包括选哪个模型、开不开思考模式、给哪些工具、要不要子智能体。

这个文件是Gateway主路径的入口。

`langgraph.json`声明的`make_lead_agent`就在这个文件里。

这个文件还处理两条安全线。

第一条是模型使用授权。

第二条是webhook来源的工具收窄。

## 二、模块里的主要成员

### 1、LeadAgentAssembly数据类

这个类是装配结果的容器。

它有三个字段。

graph字段是编译好的LangGraph图。

descriptor字段是装配描述符。

effective_model字段是最终生效的模型名。

descriptor的类型故意写得很松。

原因是这个模块在LangGraph Server启动时就会被导入。

导入路径不能牵扯扩展契约包。

### 2、unwrap_agent_graph函数

这个函数从装配结果里取出图。

传入的是LeadAgentAssembly就返回`.graph`。

传入的是裸图就原样返回。

第三方工厂和测试工厂可能返回裸图。

所以判断用类型检查而不用鸭子类型。

这个函数的职责是回答"什么算装配结果"这个问题。

这个职责集中在这一个地方。

### 3、make_lead_agent函数

这个函数是LangGraph Server的图工厂。

它的签名必须保持兼容。

它返回裸图。

内部只是调用assemble_lead_agent然后取`.graph`。

### 4、assemble_lead_agent函数

这个函数是Gateway使用的显式装配入口。

它先做checkpoint模式的冻结。

冻结规则是这样的。

进程第一次装配时，应用配置说了算。

客户端传来的configurable键会被忽略。

原因是直连的LangGraph请求不能重新配置一个新进程。

进程已经冻结后，内部注入的键或应用配置必须匹配冻结值。

不匹配就直接失败。

伪造的键和配置文件改动都不能悄悄重配进程。

它还冻结checkpoint快照频率。

快照频率跟着模式一起冻结。

它不暴露给客户端注入。

最后它把模式注入config，然后交给内部装配函数。

### 5、_assemble_lead_agent函数

这个函数是真正的装配主体。

它非常长。

它的流程可以分成几段。

#### （1）解析运行参数

它先合并configurable和runtime context。

它解析用户身份。

Server保留的认证字段优先于普通客户端值。

它解析请求的模型名、计划模式、子智能体开关。

它解析子智能体的并发上限和总上限。

并发上限还要对齐进程启动时冻结的执行容量。

它解析是否是bootstrap智能体。

它解析交互策略。

非交互运行不允许发起澄清。

它校验并加载自定义智能体配置。

#### （2）解析思考与推理选项

优先级是请求大于自定义智能体配置，自定义智能体配置大于运行时默认。

`_resolve_runtime_option`负责这个解析。

它用`key in cfg`判断键是否存在。

这个写法区分了"请求没填这个字段"和"请求填了假值"。

请求填的`thinking_enabled: false`会被尊重。

不会掉回默认值。

自定义智能体的未设置字段表示"不覆盖"。

这个问题对应issue #4336。

#### （3）解析并授权模型

`_resolve_model_name`解析最终模型名。

优先级是请求大于智能体配置大于全局默认。

请求的模型名不在配置里就回退到默认模型并打警告。

`_authorize_model_name`对解析结果做`model:use`授权。

授权开关没开就原样返回。

授权被拒时尝试优雅回退。

回退会挑第一个既可见又可用的模型。

回退也不行时看fail_closed。

fail_closed为真就抛ValueError。

fail_closed为假就放行原模型名。

这个设计和Gateway的get_model路由共享同一个契约。

这个设计对应RFC §9。

#### （4）归一化推理契约

模型有推理能力契约。

required-thinking的模型会把思考开关掰回来。

不支持的模型会把思考开关关掉。

受限的推理档位词表会映射到提供商自己的值。

这个问题对应issue #5073。

#### （5）注入元数据与追踪回调

它把装配信息写进`config["metadata"]`。

信息包括agent名、模型名、思考开关、技能列表等。

这些元数据用于LangSmith追踪打标。

它在图的调用根上挂追踪回调。

这是模块头部的强不变量。

所有图内的`create_chat_model`调用必须传`attach_tracing=False`。

忘了这个标记会产生重复span。

忘了这个标记还会阻断Langfuse的属性传播。

session_id和user_id就到不了追踪里。

#### （6）组装工具

工具来源有一批。

`get_available_tools`提供沙箱、内置、MCP、社区、子智能体工具。

交互策略禁用的工具名会被剔除。

bootstrap分支额外加`setup_agent`工具。

非bootstrap分支在满足条件时加`update_agent`工具。

webhook渠道触发的运行拿不到`update_agent`。

原因写在注释里。

webhook提示词来自任意外部评论者。

暴露这个工具等于给评论者一条改持久配置的路。

`describe_skill`工具、记忆工具、项目文档工具、任务续接工具按条件追加。

追加时按名字去重。

重名的跳过并打警告。

不丢无关的重名工具。

然后做工具授权。

授权返回两组工具。

一组是已授权的原有工具。

另一组是"晚到"的授权工具。

最后组装延迟工具。

延迟工具的schema默认不绑定给模型。

模型用`tool_search`来按需提升它们。

#### （7）组装中间件与提示词并建图

它调用`build_middlewares`拿到中间件链。

它调用`apply_prompt_template`拿到系统提示词。

它调用langchain的`create_agent`建图。

建图时传入规范化后的中间件、线程状态schema和上下文schema。

最后交给`_complete_assembly`收尾。

#### （8）bootstrap分支的差异

bootstrap智能体是创建自定义智能体用的最小智能体。

它的技能集合故意收窄到只剩bootstrap技能。

原因是创建流程要在自定义配置存在之前保持确定。

它不拥有线程的物理技能投影。

它走同一套建图流程，只是参数不同。

### 6、build_middlewares函数

这个函数是中间件链的公共入口。

`make_lead_agent`用它。

内嵌的DeerFlowClient也用它。

DeerFlowClient需要完全一样的链。

所以这个函数名必须保持稳定。

改名会波及client.py。

这个函数按照精心排好的顺序追加中间件。

顺序有明确的设计意图。

ThreadData必须在Sandbox之前，这样thread_id先可用。

Uploads要在ThreadData之后，这样才能拿到thread_id。

Summarization要放早，好尽早压缩上下文。

Clarification必须最后，这样它才能在模型调用之后拦截澄清请求。

链里包括这批中间件。

动态上下文中间件注入日期和记忆。

技能激活中间件处理`/skill-name`显式激活。

技能工具策略中间件在运行时套用allowed-tools。

持久上下文中间件捕获委托记录和技能文件。

摘要中间件按配置创建。

Todo中间件按计划模式创建。

TokenUsage、Title、Memory、ViewImage各按条件加入。

系统消息合并中间件把所有SystemMessage并成一条。

严格的后端会拒绝非开头的SystemMessage。

子智能体上限、循环检测、Token预算各按配置加入。

终止响应、模型长度截断、安全终止这三种收尾守卫加入。

Clarification最后加入。

最后它把扩展贡献合并进完整栈。

合并只发生在这里。

提前合并会改变"最终请求"的含义。

### 7、_authorize_model_name的失败语义

这个函数吞掉授权提供商的异常并降级。

降级方向由fail_closed决定。

这是模型路径的容错设计。

工具路径的`apply_tool_authorization`共享同一个Principal/provider模式。

两条路径共用一个身份来源。

### 8、_complete_assembly函数

这个函数描述成品图并通知观察者。

它把递归上限折进描述符。

递归上限是每次调用的预算，由Gateway钳制。

构建描述符要哈希每个工具的描述和schema。

构建描述符还要探测每个中间件。

这是真实的开销。

没有观察者注册时整个跳过。

这对应notify_agent_assembled自己的零观察者快路径。

### 9、两个常量

`_BOOTSTRAP_SKILL_NAMES`是bootstrap技能集合，只有bootstrap一个。

`_WEBHOOK_CHANNELS`是不可信的webhook渠道集合，目前只有github。

### 10、_subagent_release_policy函数

这个函数描述委托限制实际会怎么执行。

它返回每个子智能体类型的轮数和超时上限。

这些上限在这里读出来而不是隐着。

原因是子智能体配置一改，主智能体能花的东西就变了。

而主智能体自己的配置看起来一点没变。

## 三、它和谁协作

它依赖deerflow.config读取应用配置和智能体配置。

它依赖deerflow.models的create_chat_model创建模型。

它依赖deerflow.agents.middlewares下的一大片中间件。

它依赖deerflow.agents.lead_agent.prompt生成系统提示词。

它依赖deerflow.authz做工具和模型授权。

它依赖deerflow.runtime.checkpoint_mode冻结checkpoint模式。

它依赖deerflow.tracing构建追踪回调。

它依赖deerflow.skills、deerflow.subagents、deerflow.tools提供技能、子智能体和工具。

它被Gateway的run worker调用。

它被DeerFlowClient间接复用。

它被`langgraph.json`声明为LangGraph Server入口。

它的`build_middlewares`被client.py跨模块导入。

## 四、重要性评级

评级是10分。

理由是这个文件是整个产品的主装配点。

用户每一次对话产出的那个智能体都是这里造的。

它决定了模型、工具、中间件、提示词四大要素的最终形态。

它承载了多条安全边界。

模型授权、webhook工具收窄、checkpoint模式冻结都在这里。

模块头部的追踪不变量也由它维护。

它还是跨模块的稳定ABI。

签名或中间件顺序变动会波及Gateway和内嵌客户端。

不评10分以内的更高等级是因为评分上限就是10分。

同时SDK直连路径走的是deerflow.agents.factory的纯参数工厂。

那个工厂是本模块的并行补充。
