# app.gateway.routers包档案

源码路径是backend/app/gateway/routers/__init__.py。

## 一、这个包是干什么的

这个包是Gateway的所有HTTP路由。

用户在浏览器里做的一切操作。

操作最终都变成对这个包里某个路由的HTTP请求。

这个包把API按功能拆成30多个模块。

每个模块管一组端点。

__init__.py只导入了其中13个模块。

__init__.py导入了artifacts、assistants_compat、browser、input_polish、mcp、models、scheduled_tasks、skills、subagent_batches、suggestions、threads、thread_runs、uploads。

其余20多个路由由app.py直接导入并注册。

## 二、包里的主要成员

### 1、threads.py

threads.py是线程CRUD、状态和历史端点。

threads.py有1900多行。

端点包括创建线程、搜索线程、删除线程、分支线程。

分支线程用回放检查点从一次完成的助手回合创建新线程。

端点还包括读状态、改状态、读历史。

端点还包括/goal的读、设、删。

端点还包括/compact手动压缩上下文。

删除线程会清理线程文件系统数据、检查点、历史运行、事件、反馈、元数据。

### 2、thread_runs.py

thread_runs.py是线程级运行端点。

thread_runs.py有1800多行。

POST /runs创建后台运行。

POST /runs/stream创建运行并SSE流式返回。

POST /runs/wait创建运行并阻塞等待。

POST /runs/{rid}/cancel取消运行。

端点还有运行历史分页、单次运行详情、每运行消息、事件流。

端点还有regenerate/prepare和edit-regenerate/prepare。

这两个端点为重新生成和编辑重跑准备干净的输入。

端点还有workspace-changes工作区变更摘要。

端点还有token-usage令牌用量聚合。

端点还有artifacts/archive产物归档ZIP。

### 3、mcp.py

mcp.py是MCP配置路由。

mcp.py有1600多行。

端点管理extensions_config.json里的MCP服务器配置。

支持读取原始或掩码配置、批量更新、开关切换、添加服务器、替换单个服务器、删除服务器。

敏感值读取时掩码，保存时保留原始值。

无效配置返回400。

写入时持有extensions_config_write_lock和advisory文件锁。

### 4、skills.py

skills.py是技能路由。

skills.py有800多行。

端点包括列技能、查技能、开关技能、安装技能。

安装接口支持线程本地的.skill归档。

管理接口是admin-only。

multipart上传先授权再解析，上限100MiB文件加1MiB框架。

端点还包括自定义技能的CRUD、历史、回滚、导出。

技能列表授权通过resolve_skill_authorization过滤用户可见目录。

### 5、auth.py

auth.py是认证HTTP端点。

auth.py有1100多行。

端点包括本地登录、注册、登出、改密码、查自己、PAT管理、初始化管理员、OIDC登录和回调。

登录有节流策略。

按IP记录失败次数，超过上限锁定一段时间。

密码有强度校验和常见密码检查。

### 6、uploads.py

uploads.py是文件上传路由。

端点是POST /api/threads/{thread_id}/uploads。

支持PDF、PPT、Excel、Word文档，用markitdown转换。

文件存储在线程隔离的目录里。

重名文件加_N后缀防止覆盖。

### 7、artifacts.py

artifacts.py是产物路由。

端点流式返回文本或二进制产物，支持字节Range。

PUT原子替换outputs目录下的UTF-8文件，需要匹配SHA-256。

活动HTML内容强制下载。

活动运行时冲突。

### 8、browser.py

browser.py是浏览器会话路由。

端点包括导航到URL。

端点还包括WebSocket /threads/{thread_id}/browser/stream实时浏览器流。

### 9、models.py

models.py是模型查询路由。

GET /列模型。

GET /{name}查模型详情。

模型使用授权通过authorize_model_use。

端点还提供推理能力查询。

### 10、suggestions.py

suggestions.py是后续问题建议路由。

POST /threads/{id}/suggestions生成后续问题建议。

用一次性LLM请求。

模型返回的富文本内容先规范化，思考块先剥离，再解析JSON。

### 11、input_polish.py

input_polish.py是输入润色路由。

POST /润色输入框里的草稿。

这是短的认证LLM请求。

不创建LangGraph运行，不持久化消息，不改线程状态。

### 12、scheduled_tasks.py

scheduled_tasks.py是定时任务路由。

端点包括CRUD定时任务、触发、暂停、恢复。

端点还有preview-cron预览cron表达式。

预览调用共享的调度计算器。

不预留执行。

### 13、subagent_batches.py

subagent_batches.py是子智能体批处理路由。

端点包括列批次、查批次、列条目。

控制端点有pause、resume、cancel、retry。

端点还有results.jsonl导出。

所有端点做owner检查。

### 14、assistants_compat.py

assistants_compat.py是LangGraph兼容的assistants API。

这是一个最小桩。

桩满足useStream React钩子的初始化需求。

需求是assistants.search()和assistants.get()。

### 15、其余路由

这些路由由app.py直接导入。

- agents.py是自定义智能体CRUD。
- capabilities.py是能力查询。
- channel_connections.py是用户渠道绑定。
- channels.py是渠道状态。
- console.py是跨线程只读观测。
- features.py是UI能力。
- feedback.py是运行反馈。
- github_webhooks.py是GitHub webhook入口。
- integrations.py是托管集成。
- knowledge.py是知识检索目录。
- managed_models.py是admin托管模型配置。
- mcp_tasks.py是MCP长任务查询。
- memory.py是记忆数据。
- personal_mcp.py是个人MCP。
- plugins.py是扩展插件。
- project_documents.py是项目文档。
- project_thread_files.py是项目线程文件。
- projects.py是项目CRUD。
- runs.py是无状态运行。
- subagents.py是admin托管子智能体。
- trash.py是回收站。
- user_preferences.py是用户偏好。

## 三、它和谁协作

上游是前端、IM渠道、外部脚本。

这些调用方发HTTP请求到这个包。

下游是app.gateway.services和harness层。

路由调用services层的业务逻辑。

业务逻辑再调用deerflow运行时和持久化。

路由授权依赖app.gateway.authz。

依赖注入依赖app.gateway.deps。

## 重要性评级

评级是10分。

理由如下。

这个包是全部HTTP API的实现。

前端每个按钮背后都是这个包里的一个端点。

线程、运行、流式响应、上传、产物、技能、MCP、记忆、定时任务、批处理，全在这里。

threads.py和thread_runs.py合计近3800行，是核心运行路径。

删除这个包，产品没有任何可用功能。

所以评级是10分。
