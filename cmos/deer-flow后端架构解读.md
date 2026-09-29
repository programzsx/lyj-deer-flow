# DeerFlow后端架构解读

本文档解读DeerFlow的后端架构。

本文档基于对`backend`目录的实际代码阅读。

本文档的读者是想理解这套后端的开发者。

阅读顺序按照思维顺序展开。先看整体。再看分层。再看每个子系统。

## 一、这套系统是什么

DeerFlow是一个基于LangGraph的AI超级代理系统。

后端让AI代理能够执行代码。

后端让AI代理能够浏览网页。

后端让AI代理能够管理文件。

后端让AI代理能够把任务委派给子代理。

后端让AI代理能够跨对话保留记忆。

这些能力都运行在线程隔离的环境里。

每个对话线程有独立的工作区。

每个对话线程有独立的上传目录。

每个对话线程有独立的输出目录。

每个对话线程有独立的沙箱。

线程之间互不干扰。

## 二、服务的整体拓扑

整个系统由四个服务协作。

### 1、Nginx

Nginx监听2026端口。

Nginx是唯一的统一入口。

浏览器访问的就是这个端口。

Nginx做三件事。

`/api/langgraph/*`会被重写后转发给Gateway。

其他`/api/*`直接转发给Gateway。

非API请求转发给前端。

### 2、Gateway API

Gateway监听8001端口。

Gateway是一个FastAPI应用。

Gateway提供REST API。

Gateway同时内嵌了LangGraph兼容的agent运行时。

agent的执行不依赖外部服务。

agent的执行就在Gateway进程里。

### 3、前端

前端是Next.js应用。

前端监听3000端口。

前端通过Nginx访问后端。

### 4、Provisioner

Provisioner监听8002端口。

Provisioner是可选服务。

Provisioner只在沙箱配置为provisioner或K8s模式时启动。

## 三、后端代码的三层结构

后端代码分三层。

这三层有严格的依赖方向约束。

### 1、Harness层

Harness位于`backend/packages/harness/deerflow/`。

这个包的名字是`deerflow-harness`。

导入前缀是`deerflow.*`。

这一层是可发布的agent框架。

这一层包含agent编排。

这一层包含工具系统。

这一层包含沙箱系统。

这一层包含模型工厂。

这一层包含MCP集成。

这一层包含技能系统。

这一层包含记忆系统。

这一层包含配置系统。

这一层包含运行时。运行时就是RunManager、StreamBridge、checkpointer这些组件。

### 2、App层

App位于`backend/app/`。

导入前缀是`app.*`。

这一层是不发布的业务代码。

这一层包含FastAPI Gateway。

这一层包含IM通道集成。

IM通道包括飞书、Slack、Telegram、Discord、钉钉这些平台。

### 3、依赖方向规则

App可以导入deerflow。

deerflow绝对不能导入app。

这条规则由`tests/test_harness_boundary.py`强制执行。

这个测试在CI里跑。

违反这条规则的代码无法通过CI。

### 4、Extension API层

还有第三个包。

这个包位于`backend/packages/extension-api/`。

这个包的名字是`deerflow-extension-api`。

这个包是扩展的公开契约。

这个包刻意不导入deerflow。

这样扩展可以独立发布。

扩展通过根目录`config.yaml`的`plugins:`列表加载。

`plugins:`列表会触发代码导入。

所以这个列表由运维人员控制。

这个列表不放进可通过API修改的`extensions_config.json`。

扩展可以贡献中间件。

扩展可以贡献生命周期观测器。

扩展可以贡献Gateway服务。

扩展可以贡献FastAPI路由。

扩展的每次变更都需要重启Gateway。

## 四、一次运行的数据流

先看全貌。理解一次对话请求是怎么走的。

### 1、请求的来源

请求有四种来源。

浏览器前端通过Nginx发来HTTP请求。

IM通道通过消息总线发来内部请求。

定时任务由调度器在约定时间发起。

MCP任务通知由内部Agent运行投递。

### 2、运行的主路径

主路径是这样的。

请求进入`thread_runs.py`或`runs.py`路由。

路由调用`services.py`的`start_run`。

`start_run`调用RunManager。

RunManager位于`deerflow.runtime.runs`。

RunManager先做运行准入。

准入会创建一个持久的`run`线程操作预留。

线程操作有唯一活跃约束。

同一个线程同时只能有一个活跃操作。

操作种类包括`run`。

操作种类包括`checkpoint_write`。

操作种类包括`artifact_write`。

操作种类包括`branch`。

操作种类包括`delete`。

这些种类共享同一条唯一约束。

准入通过后。

worker开始执行。

worker位于`runtime/runs/worker.py`。

worker调用`assemble_lead_agent`生成执行图。

worker执行这张图。

### 3、事件的回传

图执行时会产生事件。

事件写入StreamBridge。

StreamBridge有两种实现。

一种是内存实现。

一种是Redis Streams实现。

Redis实现支持跨进程。

事件从StreamBridge流出。

`sse_consumer`把事件转成SSE格式。

SSE流回给客户端。

客户端还带着`Last-Event-ID`断线重连。

重连时StreamBridge会重放保留的事件。

保留窗口之外的事件会返回`gap`信号。

`gap`信号让客户端知道有缺口。

### 4、多worker的归属问题

多worker部署时。

运行的归属靠租约管理。

每个worker定期续租。

`run_ownership.heartbeat_enabled`控制心跳。

心跳开启时。

worker失去租约就会被隔离。

被隔离的worker不再写任何终态数据。

运行的主人挂了。

其他worker通过孤儿恢复机制接管。

孤儿恢复把运行标记为`error`。

标记原因是`orphan_recovered`。

多worker部署有硬性要求。

数据库必须是Postgres。

run_events后端必须是db。

心跳必须开启。

否则启动时直接拒绝。

## 五、Gateway的组装过程

Gateway的组装代码在`app/gateway/app.py`。

核心函数是`create_app()`。

核心函数还有`lifespan()`。

模块级变量`app = create_app()`供uvicorn使用。

### 1、中间件的注册

`create_app()`注册四个HTTP中间件。

FastAPI的规则是后注册的先执行。

AuthMiddleware最先注册。

AuthMiddleware最后执行。

不对。FastAPI的规则是后注册的先生效于请求。

所以执行顺序是AuthMiddleware最外层。

AuthMiddleware做认证。

认证失败请求直接被挡下。

AuthMiddleware把用户写进`request.state.user`。

CSRFMiddleware做CSRF防护。

防护用Double Submit Cookie模式。

CORSMiddleware处理跨域。

CORSMiddleware只在`GATEWAY_CORS_ORIGINS`配置了显式白名单时才挂载。

默认部署走Nginx同源。

同源场景不需要CORS。

TraceMiddleware给每个请求绑定`X-Trace-Id`。

### 2、lifespan启动流程

lifespan做应用启动。

启动顺序是严格的。

第一步加载配置快照。

`get_app_config()`读取启动期配置。

请求期的配置走`get_config()`热加载。

配置文件改了不用重启。

启动期冻结的配置除外。

沙箱模式和数据库引擎属于冻结配置。

第二步冻结subagent进程容量。

第三步确保浏览器运行时可用。

第四步做公共技能投影。

第五步设置Monocle追踪。

Monocle是可观测性组件。

Monocle失败不阻断启动。

第六步做后台预热。

预热包括记忆检索索引重建。

预热包括tiktoken缓存预热。

预热包括清理过期的上传暂存文件。

第七步进入LangGraph运行时。

`deps.py`的`langgraph_runtime`构建运行时。

运行时构建StreamBridge。

运行时构建SQLAlchemy持久化引擎。

运行时构建checkpointer。

运行时构建LangGraph store。

运行时构建run-event store。

运行时冻结checkpoint通道模式。

多worker时强制使用Postgres。

退出运行时时关闭MCP会话池。

第八步确保admin用户。

首次启动没有admin时。

日志提示访问`/setup`页面。

已有admin时。

执行孤儿线程迁移。

把无认证时期的线程归属到用户。

第九步启动各个后台服务。

先启动垃圾回收清扫任务。

然后按配置启动ScheduledTaskService。

然后启动ChannelService。

然后启动McpTaskService。

然后启动SubagentBatchService。

### 3、lifespan关闭流程

关闭也有顺序。

关闭给每个钩子5秒预算。

顺序如下。

先做trash清扫。

然后关闭OIDC服务。

然后关闭通道服务。

然后关闭调度器。

然后关闭MCP任务服务。

然后关闭子代理批量服务。

然后关闭浏览器会话。

最后刷新并关闭记忆后端。

记忆刷新是尽力而为。

记忆后端关闭要算进pod的优雅退出预算。

### 4、路由的注册

`create_app()`注册约30个router。

GitHub webhook路由特殊。

只有`GITHUB_WEBHOOK_SECRET`配置了才挂载。

没配置就404。

这是fail-closed设计。

内置`/health`端点做存活探测。

内置`/health/ready`端点做就绪探测。

就绪探测并发检查ORM引擎和checkpointer。

探测失败返回503。

扩展贡献的路由最后挂载。

宿主自己的路由保持优先。

## 六、路由清单

路由都在`app/gateway/routers/`目录下。

这里按功能领域分组说明。

### 1、线程与运行

`threads.py`负责线程本身。

前缀是`/api/threads`。

创建线程走`POST`。

删除线程走`DELETE /{id}`。

删除会清理本地数据。

分支线程走`POST /{id}/branches`。

线程搜索走`/search`。

线程改名走`PATCH`。

线程移动到项目走`/move`。

线程目标走`GET/PUT/DELETE /goal`。

手动压缩上下文走`POST /compact`。

`thread_runs.py`负责运行生命周期。

前缀是`/api/threads/{id}/runs`。

这是后端最核心的路由。

创建运行有三种方式。

`POST /runs`创建后台运行。

`POST /runs/stream`创建并返回SSE流。

`POST /runs/wait`创建并阻塞等待。

重新生成回答走`/regenerate/prepare`。

编辑后重跑走`/edit-regenerate/prepare`。

运行历史走`GET /page`。

分页用keyset方式。

取消运行走`/{rid}/cancel`。

加入现有流走`/{rid}/join`。

消息查询走`/messages`和`/messages/page`。

事件全量走`/{rid}/events`。

工作区变更走`/{rid}/workspace-changes`。

产物打包走`/{rid}/artifacts/archive`。

token用量走`/token-usage`。

运行创建支持`Idempotency-Key`头。

同一个键重试不会重复创建。

`runs.py`负责无状态运行。

前缀是`/api/runs`。

不指定thread时会自动建临时线程。

### 2、模型与配置

`models.py`负责模型列表。

前缀是`/api/models`。

`managed_models.py`是管理员专属。

前缀是`/api/managed-models`。

这个路由管理模型的增删改查。

每次修改带修订记录。

`mcp.py`管理MCP服务器配置。

前缀是`/api/mcp`。

stdio启动器有白名单。

白名单只允许npx和uvx。

shell元字符会被屏蔽。

eval类参数会被屏蔽。

`personal_mcp.py`是每用户的个人MCP。

个人MCP的文件和调用都是owner-only。

平台级MCP保持共享。

两者刻意分离。

### 3、技能与记忆

`skills.py`管理技能。

前缀是`/api/skills`。

技能列表有授权过滤。

过滤用`_filter_visible_skills`。

匿名用户看到全部技能。

`skills.py`支持安装`.skill`归档。

上传安装是admin专属。

安装有100MiB文件大小上限。

`memory.py`管理用户记忆。

前缀是`/api/memory`。

支持读取记忆数据。

支持强制重载。

支持查询配置和状态。

### 4、文件与产物

`uploads.py`负责文件上传。

前缀是`/api/threads/{id}/uploads`。

上传支持PDF。

上传支持PPT。

上传支持Excel。

上传支持Word。

这些格式自动转成Markdown。

转换用markitdown。

上传走原子发布。

暂存文件先写成`.upload-*.part`。

校验通过后原子改名。

同一请求内重名文件加`_N`后缀。

`artifacts.py`负责产物读取。

前缀是`/api/threads/{id}/artifacts`。

读取支持字节Range。

写入要求SHA-256匹配。

路径解析有防穿越校验。

`..`会被归一化后重新检查。

产物符号链接到不了uploads目录外面。

### 5、项目与组织

`projects.py`负责项目CRUD。

`project_documents.py`负责项目文档架。

`project_thread_files.py`负责对话文件视图。

`trash.py`负责回收站。

`agents.py`负责自定义Agent。

每个自定义Agent有自己的配置。

每个自定义Agent有自己的SOUL.md。

### 6、运维与观测

`console.py`提供跨线程观测。

`GET /stats`给出总量统计。

统计包括运行数、线程数、代理数、token数、成本数。

`GET /runs`给出分页的运行历史。

`GET /usage`给出按日token序列。

成本核算读`models[*].pricing`配置。

缓存命中的token按缓存价格计费。

`features.py`返回前端能力开关。

`scheduled_tasks.py`管理定时任务。

支持增删改查。

支持暂停恢复。

支持手动触发。

支持cron预览。

`subagents.py`管理托管worker子代理。

这是admin专属路由。

`subagent_batches.py`查询批量任务。

支持pause和resume。

### 7、辅助功能

`feedback.py`管理运行反馈。

`suggestions.py`生成追问建议。

`input_polish.py`润色输入草稿。

这两个路由共享同一个一次性LLM调用路径。

这个路径不创建LangGraph运行。

这个路径不持久化消息。

`knowledge.py`提供RAGFlow目录查询。

这是只读目录。

知识管理仍在RAGFlow侧。

`browser.py`管理浏览器自动化会话。

包含Live WebSocket通道。

`channels.py`查询通道运行状态。

这是admin路由。

`channel_connections.py`管理用户自有连接。

用户通过`/connect code`绑定平台账号。

`integrations.py`管理Lark集成。

`plugins.py`管理插件。

`github_webhooks.py`接收GitHub事件。

签名用HMAC校验。

校验不过就拒绝。

## 七、认证与授权

认证代码在`app/gateway/auth/`。

授权代码在`app/gateway/authz.py`。

认证回答"你是谁"。

授权回答"你能做什么"。

### 1、四种身份来源

系统认识四种身份来源。

第一种是会话cookie。

用户登录后拿到`HttpOnly access_token` cookie。

第二种是PAT。

PAT是个人访问令牌。

格式是`Authorization: Bearer dfp_...`。

PAT只存SHA-256摘要。

数据库里没有原始令牌。

PAT只能访问threads、runs、projects白名单路由。

PAT永远不带admin能力。

无效的Bearer直接401。

不回落到cookie。

第三种是内部身份。

这是进程内通道worker用的身份。

worker带内部认证头。

worker可以带owner_user_id头。

这样IM消息以绑定用户的身份运行。

第四种是auth禁用模式。

配置关闭认证时进入单用户模式。

这种模式只适合本机单人使用。

### 2、登录方式

本地登录用密码。

密码用标准哈希存储。

登录有弱密码黑名单。

黑名单来自SecLists常见弱密码。

登录有IP限速。

失败次数过多会锁定。

登录支持`remember_me`。

勾选后cookie持久化。

持久化有安全条件。

HTTPS下允许持久化。

localhost的HTTP下允许持久化。

其他情况退化为会话cookie。

公网HTTP下绝不持久化。

### 3、OIDC登录

系统支持OIDC单点登录。

`oidc.py`实现完整授权码流程。

流程带PKCE。

state和nonce存在加密cookie里。

code换token后验签id_token。

验签用JWKS。

新用户自动开户。

开户逻辑在`user_provisioning.py`。

### 4、JWT与会话

访问令牌是JWT。

`jwt.py`负责签发和解析。

令牌载荷带`token_version`。

用户改密码后版本号变。

旧令牌全部失效。

会话cookie策略在`session_cookie.py`。

`SessionCookiePolicy`统一决定持久化行为。

CSRF cookie的过期时间和会话同步。

登出清空全部认证cookie。

### 5、授权层

授权是独立于认证的一层。

`authz.py`提供`@require_permission`装饰器。

例如`@require_permission("threads", "read", owner_check=True)`。

权限定义包括`threads:read`。

权限定义包括`threads:write`。

权限定义包括`threads:delete`。

权限定义包括`runs:create`。

权限定义包括`runs:read`。

权限定义包括`runs:cancel`。

权限定义包括`memory`、`agents`、`projects`各动作。

授权提供者可插拔。

内置提供者是RBAC。

配置段是`authorization:`。

默认关闭。

支持`fail_closed`和`fail_open`两种失败模式。

fail_closed模式下提供者出错就拒绝。

fail_open模式下提供者出错就放行。

安全敏感路由用fail_closed。

### 6、首次初始化

首次启动没有admin。

用户访问`/setup`页面。

页面调用`POST /api/v1/auth/initialize`创建首个admin。

## 八、Lead Agent运行时

Lead Agent是唯一的执行主体。

所有对话都由它处理。

### 1、创建流程

入口函数是`make_lead_agent`。

这个函数在`packages/harness/deerflow/agents/lead_agent/agent.py`。

`langgraph.json`声明这个入口。

Gateway实际用`assemble_lead_agent()`。

这个函数返回`LeadAgentAssembly`。

组装包含图。

组装包含描述符。

组装包含生效模型。

组装过程是这样的。

第一步合并配置。

`configurable`和`context`合并。

第二步解析身份。

解析user_id。

解析agent_name。

第三步解析模型。

优先级是请求指定大于自定义Agent配置。

自定义Agent配置大于默认配置。

模型解析后做`model:use`授权。

授权拒绝时优雅降级。

第四步归一推理契约。

第五步渲染系统提示。

模板注入技能。

模板注入记忆。

模板注入子代理清单。

运维可以用`lead_prompt_overlay`加前后缀。

系统提示保持静态。

静态有利于前缀缓存。

动态内容不进系统提示。

第六步收集工具。

工具来自沙箱。

工具来自内置。

工具来自MCP。

工具来自社区。

工具来自子代理。

收集后做工具授权过滤。

第七步装配延迟工具。

延迟工具用tool_search按需提升。

第八步构建中间件链。

第九步调用LangChain的`create_agent`。

状态模式有两种。

full模式全量保存通道。

delta模式增量保存。

模式在启动时冻结。

客户端不能注入模式。

### 2、中间件链

中间件链的顺序是严格的。

`build_middlewares()`按以下顺序组装。

第一段是运行时基础设施。

ThreadDataMiddleware先执行。

它创建线程隔离目录。

UploadsMiddleware随后。

它把新上传的文件注入上下文。

SandboxMiddleware随后。

它管理沙箱生命周期。

这三件套要求thread_id先可用。

然后是DanglingToolCall处理。

然后是护栏中间件。

护栏是可选的。

然后是工具错误处理。

然后是PII脱敏。

脱敏是可选的。

然后是安全审计中间件。

第二段是动态上下文。

DynamicContextMiddleware把日期和记忆注入首条HumanMessage。

注入格式是system-reminder标记。

系统提示保持不变。

第三段是技能激活。

SkillActivationMiddleware处理`/skill-name`显式激活。

激活时加载SKILL.md。

第四段是延迟工具审计。

有延迟工具时才挂载。

第五段是技能工具策略。

SkillToolPolicyMiddleware执行技能的allowed-tools约束。

第六段是持久上下文。

DurableContextMiddleware注入委派台账。

注入摘要。

注入技能清单。

注入发生在摘要压缩之前。

第七段是摘要压缩。

DeerFlowSummarizationMiddleware是可选的。

token逼近上限时摘要旧历史。

旧历史压缩进`summary_text`。

最近消息保持原样。

第八段是任务清单。

TodoMiddleware在plan模式下挂载。

提供`write_todos`工具。

第九段是token统计。

TokenUsageMiddleware是可选的。

第十段是标题生成。

TitleMiddleware在首轮对话后生成标题。

纯附件消息用文件名做标题。

第十一段是记忆提取。

MemoryMiddleware在memory启用时挂载。

对话进队列异步提取记忆。

提取不阻塞对话。

第十二段是图像注入。

ViewImageMiddleware在模型支持视觉时挂载。

图像转base64注入。

注入发生在`wrap_model_call`里。

图像不进图状态。

检查点只存轻量的`viewed_images`元数据。

第十三段是MCP路由。

McpRoutingMiddleware提升延迟MCP的schema。

DeferredToolFilterMiddleware隐藏未提升的工具。

第十四段是系统消息合并。

SystemMessageCoalescingMiddleware把所有SystemMessage合并成一条。

这对vLLM和SGLang是必要的。

这对Anthropic也是必要的。

第十五段是子代理限流。

SubagentLimitMiddleware在子代理启用时挂载。

并发上限是3。

单轮总量也有限制。

第十六段是循环检测。

LoopDetectionMiddleware是可选的。

检测重复的工具调用集。

检测单工具高频调用。

硬限制触发时停止整个批次。

第十七段是token预算。

TokenBudgetMiddleware是可选的。

给每次运行设token硬上限。

第十八段是扩展中间件。

配置文件声明的自定义中间件在这里加入。

第十九段是空回复兜底。

TerminalResponseMiddleware处理空回复。

第二十段是长度截断处理。

ModelLengthFinishReasonMiddleware处理输出超长。

第二十一段是安全终止。

SafetyFinishReasonMiddleware是可选的。

模型因安全原因终止时抑制工具执行。

第二十二段是澄清拦截。

ClarificationMiddleware永远最后。

它拦截`ask_clarification`调用。

拦截后转成Human Input卡中断运行。

等用户回答后继续。

第二十三段合并扩展贡献。

`compose_with_extensions()`合并扩展声明的中间件。

### 3、目标循环

线程可以设定目标。

`PUT /api/threads/{id}/goal`设置目标。

每个可见轮结束后。

系统评估目标是否达成。

评估用非思考的评估模型。

评估只看可见对话证据。

评估返回结构化的阻碍描述。

目标达成就清除目标。

目标未达成就续跑。

续跑用隐藏的HumanMessage。

续跑最多8次。

这是硬上限。

连续两次续跑没有新产出就熔断。

熔断防止无限循环。

### 4、上下文压缩

上下文逼近token上限时自动摘要。

配置段是`summarization:`。

触发条件有三种。

按token数触发。

按消息数触发。

按输入占比触发。

手动压缩走`POST /api/threads/{id}/compact`。

手动压缩复用同一个摘要中间件。

手动压缩写新检查点。

手动压缩有运行准入。

运行中不允许压缩。

## 九、沙箱系统

沙箱提供线程隔离的代码执行环境。

### 1、抽象接口

`deerflow/sandbox/sandbox.py`定义抽象接口。

接口方法包括`execute_command`。

接口方法包括`read_file`。

接口方法包括`write_file`。

接口方法包括`str_replace`。

接口方法包括`ls`。

环境变量名有POSIX格式校验。

校验防止环境注入。

### 2、提供者

提供者有多种。

默认提供者是`LocalSandboxProvider`。

它直接用本地文件系统。

它默认禁用bash工具。

因为本机bash没有隔离。

`AioSandboxProvider`用Docker容器。

容器有LRU副本上限。

容器有warm pool复用。

发现死容器会剔除。

E2B提供者是云端沙箱。

openSandbox是另一种云沙箱。

provisioner模式用K8s。

provisioner是8002端口的独立服务。

### 3、生命周期

SandboxMiddleware管理生命周期。

默认惰性初始化。

首次工具调用才获取沙箱。

这样可以省掉不必要的开销。

主代理和子代理各持独立租约。

最后一个持有者释放时。

远端沙箱才归还warm pool。

网络策略有三种。

open开放全部网络。

isolated完全断网。

allowlist按白名单放行。

策略变更走Human Input卡审批。

### 4、虚拟路径

沙箱内看到的是虚拟路径。

`/mnt/user-data/workspace`映射线程工作区。

`/mnt/user-data/uploads`映射线程上传目录。

`/mnt/user-data/outputs`映射线程输出目录。

`/mnt/skills`映射技能目录。

技能目录递归发现SKILL.md。

嵌套技能保留容器路径。

### 5、文件写入安全

`str_replace`工具做读改写。

读改写按`(sandbox.id, path)`串行化。

不同沙箱的相同虚拟路径互不阻塞。

## 十、子代理系统

子代理把任务委派给后台执行。

### 1、内置代理

内置两种子代理。

`general-purpose`拥有完整工具集。

`bash`是命令专家。

bash代理只在shell可用时暴露。

### 2、容量控制

`capacity.py`做进程级FIFO准入。

并发上限在启动时冻结。

超出的任务排队。

排队策略可配置。

### 3、执行引擎

`executor.py`是执行引擎。

每个任务在独立事件循环里跑。

执行引擎生成服务端`execution_id`。

这个ID是注册表的键。

provider的`tool_call_id`是另一个ID。

这个ID是ToolMessage的关联键。

这个ID是SSE事件的关联键。

这个ID是前端卡片的关联键。

两个ID刻意分离。

因为provider ID不全局唯一。

拿provider ID当注册表键会导致所有权错乱。

### 4、任务工具

`task`是主代理的委派工具。

调用后任务进后台执行。

`task_*`系列自定义SSE事件回报进度。

token用量经`SubagentTokenCollector`归因。

归因记回父运行。

### 5、批量任务

批量任务把一批子代理任务持久化。

每个worker持有一个generation。

提交先入库。

然后逐项执行。

执行用租约保护。

worker挂了其他实例可以恢复。

`batch_task`是提交工具。

`batch_status`是查询工具。

`cancel_batch`是取消工具。

## 十一、消息通道系统

通道系统连接外部IM平台。

代码在`app/channels/`。

### 1、总体架构

外部平台的消息进来。

Channel子类收到消息。

Channel把消息包装成`InboundMessage`。

MessageBus发布入站消息。

ChannelManager消费入站消息。

ChannelManager通过langgraph-sdk调用Gateway。

调用方式同前端。

运行产生`OutboundMessage`。

MessageBus发布出站消息。

各Channel收到出站消息。

Channel调用`send()`发回平台。

### 2、消息总线

`message_bus.py`是异步发布订阅枢纽。

入站队列有界。

默认容量1000。

过载时显式丢弃。

丢弃带限速告警。

准入是两段式。

先`reserve_inbound`预留。

再`commit`提交。

附件字节走瞬态通道传递。

### 3、ChannelManager

`manager.py`是核心分发器。

它支持命令。

`/new`开新对话。

`/status`查状态。

`/models`查模型。

`/memory`查记忆。

`/goal`查目标。

`/agent`切代理。

`/help`查帮助。

slash加技能名直接激活技能。

流式文本有白名单。

白名单只允许assistant类消息发布。

隐藏的记忆上下文不会泄漏到IM。

首次建线程用键锁串行化。

防止重复建线程。

### 4、运行策略

`run_policy.py`为每个通道声明策略。

策略声明交互模式。

非交互通道设置`disable_clarification`。

`ask_clarification`变成"按最佳判断继续"。

策略声明递归上限。

策略声明凭据提供者。

GitHub通道注入GH_TOKEN。

策略声明是否需要绑定身份。

策略声明是否fire-and-forget。

策略声明是否串行化同线程运行。

策略声明忙碌时是否缓冲后续消息。

GitHub忙碌时缓冲评论。

StreamBridge watcher自动排空缓冲。

### 5、支持的通道

注册表里支持九种通道。

slack支持工作区消息。

discord支持服务器消息。

telegram支持机器人对话。

telegram用editMessageText原地更新流式文本。

feishu支持飞书。

feishu用卡片原地patch流式。

dingtalk支持钉钉。

dingtalk用AI卡片流式。

wechat支持个人微信。

wecom支持企业微信。

buzz支持Nostr中继。

buzz用kind-40003事件原地编辑流式。

github支持issue和PR评论。

github是webhook驱动。

github出站只记日志。

agent用沙箱内的`gh`CLI回帖。

### 6、连接绑定

用户把平台账号绑定到DeerFlow账号。

绑定走`channel_connections`。

绑定方式是`/connect code`。

Telegram用`/start code`。

每个连接有唯一活跃owner。

唯一性由数据库部分唯一索引保证。

### 7、去重

入站消息有去重。

`dedupe_store.py`做这件事。

去重存储可以用Postgres。

Postgres去重跨pod生效。

同一平台消息不会触发两次运行。

## 十二、三个后台服务

### 1、McpTaskService

代码在`app/mcp_tasks/service.py`。

这个服务管理持久MCP任务。

Agent循环里只做submit。

任务状态由服务管理。

任务轮询由数据库承担。

Agent循环不被远端任务卡住。

恢复机制用租约。

通知最多重试5次。

重试耗尽进死信。

通知用内部Agent运行投递。

投递指令在用户输入边界之外。

序列化的远端事件在模型调用前标记为不可信。

结果大小有限制。

持久化的错误最多4000字符。

### 2、ScheduledTaskService

代码在`app/scheduler/service.py`。

这个服务是cron定时调度器。

每个轮询周期做固定动作。

先做租约恢复。

单实例恢复过期启动声明。

多实例恢复活跃状态。

然后处理队列超时。

然后排空队列。

然后认得到期任务。

认领用租约保护。

并发上限在数据库锁内原子计数。

认领后调度任务。

调度走正常Gateway运行路径。

递归上限默认1000。

改配置文件即时生效。

不用重启。

### 3、SubagentBatchService

`app/subagent_batches/service.py`是harness实现的再导出。

实现在harness的`batch_service.py`。

这个服务提供持久的批量子代理任务。

启停由`subagent_batches.enabled`配置控制。

## 十三、记忆系统

记忆让代理跨对话保留信息。

### 1、架构

记忆管理器是可插拔的。

配置段是`memory:`。

`manager_class`选择实现。

默认实现是deermem。

其他实现包括mem0。

其他实现包括honcho。

其他实现包括openviking。

其他实现包括noop。

每个后端在`backends/<name>/MANAGER_CLASS`声明入口。

`MemoryManager`定义九个方法的契约。

### 2、工作模式

记忆有两种模式。

middleware模式在对话中被动提取。

提取进队列异步执行。

tool模式把记忆操作暴露成工具。

代理主动调用记忆工具。

### 3、运行时注入

每次对话开始时。

DynamicContextMiddleware把相关记忆注入首条HumanMessage。

注入用system-reminder标记。

注入的内容按线程相关性检索。

检索索引在启动时预热重建。

### 4、关闭语义

关闭时刷新记忆。

刷新是尽力而为的。

刷新有配置的超时预算。

刷新和关闭合成一个drain操作。

malformed的配置编辑不能中断运行时清理。

## 十四、配置系统

配置文件在仓库根目录。

`config.example.yaml`是模板。

复制成`config.yaml`使用。

`config.yaml`在gitignore里。

不会提交。

`extensions_config.example.json`是MCP和技能的模板。

复制成`extensions_config.json`使用。

这个文件运行时可经API修改。

### 1、主要配置段

`models`段配置模型数组。

每个模型有name。

有use字段指定工厂类。

有api_base。

有api_key。

api_key支持`$ENV`引用环境变量。

有context_window。

有supports_thinking。

有supports_vision。

有pricing定价。

pricing支持缓存命中价。

`sandbox`段配置沙箱。

`use`指定提供者类路径。

`allow_host_bash`控制本机bash。

`mounts`配置目录挂载。

`bash_command_timeout`默认600秒。

`database`段配置持久化。

backend可选sqlite。

backend可选postgres。

backend可选memory。

多worker强制postgres。

`checkpoint_channel_mode`可选full。

可选delta。

`scheduler`段配置定时调度。

有enabled开关。

有poll_interval。

有lease配置。

有max_concurrent_runs。

有multi_instance开关。

`memory`段配置记忆。

有enabled开关。

有injection_enabled开关。

有manager_class。

有mode选择。

有backend_config。

`run_ownership`段配置租约。

lease_seconds默认30。

grace默认10。

heartbeat_enabled默认关闭。

多worker必须开启。

`channels`段配置各通道凭据。

飞书配app_id和app_secret。

Slack配bot_token。

Telegram配bot_token。

钉钉配card_template_id。

GitHub配私钥。

buzz配private_key。

`authorization`段配置授权。

默认关闭。

有provider。

有fail_closed。

有default_role。

### 2、热加载边界

配置分两类。

一类是启动快照。

数据库引擎属于启动快照。

StreamBridge类型属于启动快照。

checkpointer属于启动快照。

子代理容量属于启动快照。

checkpoint通道模式属于启动快照。

这些改了要重启。

一类是请求期配置。

请求期配置走`get_config()`。

每次请求重新读取。

改配置文件即时生效。

不用重启。

## 十五、可观测性

### 1、运行事件契约

运行事件流有契约。

契约由四处文件共同维护。

`deerflow/constants.py`定义信封上限。

事件类型上限32字符。

分类上限16字符。

`runtime/events/catalog.py`定义运行时事件。

`contracts/run_event_stream_contract.json`定义负载schema。

`backend/docs/RUN_EVENT_STREAM.md`是文档。

改动这四处必须同步。

契约测试强制校验。

### 2、工作区变更快照

`deerflow/workspace_changes/`做前后快照。

快照范围是workspace目录。

快照范围是outputs目录。

uploads刻意排除。

有变更时产生`workspace_changes`事件。

文本差异有限制。

二进制文件只记元数据。

大文件只记元数据。

敏感路径只记元数据。

内部反馈目录不算变更。

浏览器截图目录不算变更。

工具输出外置目录不算变更。

### 3、交付回执

运行结束时推导交付要求。

要求来自outputs目录的新增和修改文件。

回执在终态前幂等持久化。

缺失覆盖时运行降级为error。

没有变更产物时保持普通对话行为。

多worker部署要求`run_events.backend: db`。

### 4、追踪

每个HTTP请求有TraceMiddleware绑定trace_id。

Monocle是可选的分布式追踪。

LLM调用注入Langfuse元数据。

注入的元数据包括thread_id。

包括user_id。

包括deerflow_trace_id。

## 十六、安全设计要点

这套后端的安全设计值得单独总结。

### 1、fail-closed原则

GitHub webhook没配密钥就不挂载路由。

MCP启动器有白名单。

PAT无效就硬401。

授权提供者出错按fail_closed拒绝。

扩展解析不出身份就拒绝。

默认姿态是拒绝。

### 2、信任边界

客户端输入的`body.context`和`body.config`会被清洗。

服务端专属的运行上下文只允许内部调用注入。

外部请求携带的这类键全部剥离。

`disable_clarification`和`non_interactive`视为同类。

这类键只有内部认证调用可以携带。

客户端伪造会被丢弃。

外部输入里的system角色消息会被拒绝。

只有内部来源的运行输入可以保留。

### 3、路径安全

产物读取有路径校验。

校验归一化`..`。

校验重新检查解析后的物理路径。

编码穿越无效。

符号链接出不了根目录。

上传暂存文件对列席接口隐藏。

### 4、密钥保护

PAT只存SHA-256摘要。

密码只存哈希。

会话cookie是HttpOnly。

CSRF用双提交cookie模式。

登录有弱密码黑名单。

登录有IP限速锁定。

MCP凭据不进工具schema。

凭据走独立的凭据环境键。

## 十七、小结

DeerFlow后端的核心思路可以归纳为几点。

### 1、单一运行时入口

所有请求最终走同一条运行路径。

前端走这条路。

IM通道走这条路。

定时任务走这条路。

MCP通知走这条路。

路径统一带来一致的行为。

路径统一带来统一的准入。

路径统一带来统一的恢复。

### 2、持久化优先

运行状态落库。

批量任务落库。

定时任务落库。

MCP任务落库。

进程重启后可以恢复。

多实例可以接管。

数据库是事实来源。

### 3、隔离无处不在

线程之间隔离工作区。

线程之间隔离上传。

线程之间隔离产物。

主代理和子代理隔离租约。

个人MCP和平台MCP隔离。

用户和用户隔离资源。

### 4、契约先行

运行事件有JSON契约。

子代理状态有契约。

技能审查有契约。

扩展API有独立契约包。

契约变更有测试强制同步。

这套后端代码量大。

但结构清晰。

分层规则被CI强制。

关键不变量被AGENTS.md文档化。

理解了运行数据流。

理解了中间件链。

理解了租约与恢复。

这套系统就好入手了。