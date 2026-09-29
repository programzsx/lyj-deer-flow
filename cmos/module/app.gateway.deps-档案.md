# app.gateway.deps-档案

源码路径是backend/app/gateway/deps.py。

## 一、这个模块是干什么的

deps.py是FastAPI依赖注入的集合。

单例对象存放在app.state上。

deps.py提供访问这些对象的函数。

路由通过依赖注入拿到运行时对象。

必需对象缺失时返回503。

这个模块有931行。

## 二、模块里的主要成员

### 1、langgraph_runtime

langgraph_runtime是运行时生命周期。

它初始化stream bridge。

它初始化持久化引擎。

它初始化checkpointer。

它初始化store和run-event store。

引擎接受startup_config快照。

引擎按设计绑定启动时配置。

改配置需要重启进程。

它还处理在途运行的排空。

它恢复崩溃前中断的运行。

### 2、访问函数

- get_config返回AppConfig。
- get_store返回LangGraph store。
- get_thread_store返回线程元数据存储。
- get_scheduled_task_service返回定时任务服务。
- get_mcp_task_service返回MCP任务服务。
- get_subagent_batch_service返回批处理服务。
- get_run_context返回运行上下文。
- get_local_provider返回本地认证提供方。
- get_pat_repo返回PAT仓库。

_require是统一的503访问器。

### 3、认证函数

- get_current_user_from_request解析当前用户。
- get_optional_user解析可选用户。
- is_admin_user判断管理员。
- require_admin_user要求管理员权限。

### 4、配置热加载

AppConfig不缓存在app.state上。

每次解析走get_app_config。

get_app_config按mtime热加载。

改config.yaml下一次请求就生效。

## 三、它和谁协作

上游是全部路由模块。

路由用Depends拿到服务对象。

下游是harness层的运行时和持久化。

app.py的lifespan用AsyncExitStack初始化。

## 重要性评级

评级是10分。

理由如下。

依赖注入是全部路由的取数通道。

每个路由都依赖deps.py的函数。

运行时初始化也在这里。

持久化引擎、checkpointer、store都由它创建。

配置热加载的设计影响所有配置项。

认证函数被全部端点使用。

没有它，路由拿不到任何运行时对象。

所以评级是10分。
