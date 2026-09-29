# app.gateway包档案

源码路径是backend/app/gateway/__init__.py。

## 一、这个包是干什么的

app.gateway包是FastAPI网关API。

Gateway监听8001端口。

Gateway是后端的核心服务。

所有REST API都在Gateway里。

前端、IM渠道、外部脚本都通过Gateway访问DeerFlow。

Gateway不只是API壳。

Gateway内嵌了LangGraph兼容的智能体运行时。

Nginx把/api/*代理到Gateway。

Nginx把/api/langgraph/*重写到Gateway的原生路由。

## 二、包里的主要成员

### 1、__init__.py

__init__.py导出GatewayConfig和get_gateway_config。

__init__.py用__getattr__惰性暴露FastAPI应用。

导入app.gateway包本身不会初始化FastAPI应用。

只有访问app或create_app属性时才导入app.py。

这个设计让导入保持轻量。

### 2、config.py

config.py定义GatewayConfig。

配置包含host、port、enable_docs。

配置从GATEWAY_HOST、GATEWAY_PORT、GATEWAY_ENABLE_DOCS环境变量读取。

空字符串视为未设置。

### 3、app.py

app.py是FastAPI应用本体。

app.py有将近1200行。

app.py创建FastAPI实例。

app.py注册全部路由模块。

app.py注册中间件链。

中间件包括AuthMiddleware、CSRFMiddleware、TraceMiddleware、CORS。

app.py定义lifespan生命周期。

lifespan里初始化运行时、持久化引擎、各个后台服务。

lifespan里启动定时任务服务、渠道服务、MCP任务服务、批处理服务。

lifespan里处理优雅关闭。

### 4、deps.py

deps.py是FastAPI依赖注入的集合。

deps.py有900多行。

deps.py提供get_config、get_store、get_thread_store等获取函数。

deps.py提供get_scheduled_task_service、get_mcp_task_service、get_subagent_batch_service。

deps.py提供get_current_user等认证函数。

### 5、services.py

services.py是网关业务服务层。

services.py有将近2500行。

services.py包含运行参数解析、检查点状态访问、上下文键处理等核心逻辑。

### 6、authz.py

authz.py是路由授权模块。

authz.py有1000多行。

authz.py提供require_permission装饰器。

authz.py提供resolve_route_permissions。

HTTP中间件、装饰器授权、浏览器WebSocket准入共用这套授权。

### 7、中间件文件

auth_middleware.py是认证中间件。

csrf_middleware.py是CSRF中间件。

trace_middleware.py是链路追踪中间件。

auth_disabled.py定义内部认证来源。

### 8、auth子包

auth子包负责JWT认证、OIDC登录、会话cookie、个人访问令牌。

详情见app.gateway.auth包档案。

### 9、routers子包

routers子包含30多个路由模块。

详情见app.gateway.routers包档案。

### 10、github子包

github子包处理GitHub webhook分发。

详情见app.gateway.github包档案。

### 11、运行时辅助文件

langgraph_runtime相关逻辑在deps.py。

langgraph_auth.py处理LangGraph Studio的owner过滤。

langgraph_studio.py是LangGraph Studio的自定义应用模块。

health.py提供/health和/health/ready探针。

capabilities.py提供能力查询。

conversation_access.py和conversation_reader.py提供会话引用只读工具。

checkpoint_lineage.py和checkpoint_retention.py处理检查点血缘和保留。

pagination.py提供分页。

path_utils.py提供路径解析和outputs目录约束。

run_models.py定义RunCreateRequest请求模型。

upload_ingestion.py处理上传摄取。

skill_export.py处理技能导出。

artifact_archive.py处理产物归档ZIP。

context_usage.py计算上下文用量。

personal_mcp_access.py处理个人MCP访问。

knowledge_scope_admission.py处理知识范围准入。

browser_capability.py确保浏览器运行时可用。

internal_auth.py创建内部认证头。

utils.py是通用工具。

## 三、它和谁协作

上游是三类调用方。

调用方是前端Next.js应用。

调用方是IM渠道层app.channels。

调用方是外部脚本和LangGraph SDK。

下游是harness层。

Gateway调用deerflow.*获得运行时、配置、沙箱、持久化。

Nginx是网络入口。

Nginx把请求代理到Gateway。

## 重要性评级

评级是10分。

理由如下。

Gateway是整个后端的唯一API面。

前端所有功能都通过Gateway的REST API实现。

IM渠道通过Gateway创建线程和运行智能体。

所有30多个路由模块、4层中间件、生命周期管理都挂在这个包下面。

没有这个包，前后端就完全断开。

删除这个包等于删除整个后端服务。

运行时、持久化、渠道全部失去入口。

所以评级是10分。
