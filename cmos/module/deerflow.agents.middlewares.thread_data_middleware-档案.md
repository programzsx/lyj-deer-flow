# deerflow.agents.middlewares.thread_data_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/thread_data_middleware.py。

## 一、这个中间件是干什么的

这个中间件负责为每个线程准备数据目录。

DeerFlow给每个会话线程一套独立的工作目录。

目录结构是users/{user_id}/threads/{thread_id}/user-data/下面分三个子目录。

三个子目录是workspace、uploads、outputs。

workspace是智能体工作沙箱的目录。

uploads存放用户上传的文件。

outputs存放线程产出的文件。

这个中间件解析出这三个路径。

这个中间件把路径写进线程状态。

后续的工具和中间件从状态里读路径。

后续工具和中间件不用自己解析路径。

## 二、模块里的主要成员

### 1、ThreadDataMiddlewareState

ThreadDataMiddlewareState是这个中间件定义的状态schema。

这个schema兼容ThreadState。

这个schema声明了一个thread_data字段。

thread_data是可选字段。

thread_data存放三个路径。

thread_data的类型是ThreadDataState或None。

### 2、ThreadDataMiddleware类

ThreadDataMiddleware是这个中间件的核心类。

这个类继承AgentMiddleware。

构造函数接收两个参数。

第一个参数是base_dir。

base_dir是线程数据的根目录。

不传base_dir时用get_paths()解析默认路径。

第二个参数是lazy_init。

lazy_init控制目录创建的时机。

lazy_init默认是True。

lazy_init是True时只算路径。

lazy_init是True时目录等到真正需要时才创建。

lazy_init是False时立即创建目录。

### 3、_get_thread_paths方法

_get_thread_paths方法解析三个路径。

这个方法返回一个字典。

字典包含workspace_path、uploads_path、outputs_path三个键。

路径由Paths对象的方法生成。

sandbox_work_dir生成workspace路径。

sandbox_uploads_dir生成uploads路径。

sandbox_outputs_dir生成outputs路径。

### 4、_create_thread_directories方法

_create_thread_directories方法真正创建目录。

这个方法调用Paths.ensure_thread_dirs。

ensure_thread_dirs创建全部三个目录。

创建完目录后返回路径字典。

### 5、before_agent钩子

before_agent是核心钩子。

before_agent在每次智能体运行开始时执行。

before_agent先解析thread_id。

thread_id优先从runtime.context取。

runtime.context没有时从config.configurable取。

两个地方都没有thread_id时抛ValueError。

没有thread_id就没法确定目录位置。

before_agent再解析user_id。

user_id用resolve_runtime_user_id(runtime)解析。

user_id用于按用户隔离目录。

然后根据lazy_init决定行为。

lazy_init是True时只算路径。

lazy_init是False时创建目录。

before_agent还会处理最后一条消息。

最后一条消息是HumanMessage时给消息打标。

消息的name补成"user-input"。

消息的additional_kwargs里写入run_id。

消息的additional_kwargs里写入timestamp。

timestamp是UTC时间的ISO格式。

before_agent返回两个状态更新。

第一个更新是thread_data。

第二个更新是messages。

## 三、它和谁协作

这个中间件在共享运行时基础链里排第5位。

装配入口是tool_error_handling_middleware.py的_build_runtime_middlewares。

装配顺序在目录的AGENTS.md里有完整描述。

这个中间件排在InputSanitization、ToolOutputBudget、ToolResultSanitization、PiiRedaction之后。

这个中间件排在UploadsMiddleware之前。

这个中间件依赖deerflow.config.paths.Paths。

Paths负责路径解析和目录创建。

这个中间件依赖deerflow.runtime.user_context.resolve_runtime_user_id。

这个函数解析运行时用户身份。

身份来源包括Gateway的runtime context和独立LangGraph Server的认证。

解析不到时回退到请求的ContextVar，再回退到"default"。

这个中间件写入的thread_data被沙箱工具使用。

这个中间件写入的thread_data被上传相关中间件使用。

## 重要性评级

评级是7分。

理由如下。

每个线程的目录隔离是整个系统的地基。

没有这组路径，沙箱工作、上传、产出都没有落点。

这个中间件统一了路径解析。

后续组件不用各自解析路径。

这个中间件还给首条用户消息打上run_id和时间戳。

时间戳是消息溯源的数据来源。

不评8分以上的原因是这个中间件本身逻辑简单。

这个中间件不做复杂决策。

这个中间件只在运行开始时算一次路径。

删除它等于删除目录隔离能力，所以不能低于7分。

所以评级是7分。
