# deerflow.extensions.gateway档案

## 一、这个模块是干什么的

这个模块是Gateway侧的扩展管道。

扩展可以贡献三种东西到Gateway。HTTP路由、Gateway服务、模型调用适配。这个模块负责这三种东西在Gateway里的装载和生命周期。

具体做四件事。

第一件事。把扩展贡献的路由挂载到Gateway应用上。挂载前做冲突检测。能证明被宿主路由遮盖的贡献路由会被拒绝。安全性要求很严格。

第二件事。按注册顺序启动扩展服务。启动失败fail-open。关闭时按相反顺序停止。每个服务有独立的超时预算。

第三件事。识别身份。贡献路由的请求已经过了宿主的认证中间件。但"登录了"和"是管理员"是两个问题。贡献路由通过resolver拿到一个中立的身份投影。

第四件事。防护宿主的公共路径。贡献路由不能进入宿主的公共命名空间和保留路径。

## 二、模块里的主要成员

### 1、include_contributed_routers函数

挂载贡献路由的主函数。流程如下。

- 先收集宿主现有路由的声明。每条声明记录路径、匹配器、HTTP方法、作用域。
- 逐个处理扩展路由。先做校验。生命周期钩子不支持。自定义lifespan不支持。Starlette Mount不支持。WebSocket路由不支持。
- 重新编译路径。FastAPI的include_router会用include时的转换器注册表重建每条路由。预检必须投影同样的语义。
- 检查公共路径。贡献路由不能进入宿主的公共前缀。比如`/health`、`/docs`、`/api/webhooks/`。也不能进入保留的精确路径。比如登录、注册。也不能进入CSRF豁免路径。
- 检查遮盖。能证明被之前的宿主或扩展路由遮盖的路由被拒绝。
- 挂载。include_router失败时删除本次尝试加的路由。整体回滚。
- 一个路由挂载失败不阻止后面的路由。

### 2、遮盖证明的匹配器

`_matcher_covers`函数判断一条路由是否被另一条完全覆盖。

匹配器只证明确定性的遮盖。用的手段有下面这些。

- 归一化的参数名。
- 静态与动态匹配的区分。
- 内置转换器的包含关系。比如str转换器覆盖int、float、uuid。
- 复合路径段的覆盖。比如`/files/{path}`覆盖`/files/a/b`。
- 整段path兜底。比如`{path:path}`覆盖一切。
- Mount的后代规则。

需要通用正则语言包含关系才能判断的情况一律放行。不猜。

### 3、start_services和stop_services函数

`start_services`按注册顺序启动服务。每个服务拿到一个`ExtensionRuntimeDeps`快照。快照里有应用存储、宿主策略投影、会话工厂、只读运行证据读取器。

服务启动失败fail-open。只有宿主任务真正被取消时才传播CancelledError。用`asyncio.Task.cancelling()`计数区分取消的来源。

`stop_services`按相反顺序停止。每个服务有独立的超时预算。默认30秒。超时也fail-open继续关闭。

### 4、宿主保留路径常量

模块顶部定义了宿主公共前缀、公共精确路径、CSRF豁免路径。这些是安全边界。贡献路由不得覆盖。

## 三、它和谁协作

这个模块依赖`deerflow.extensions.registry.LoadedExtensions`。它消费冻结的扩展快照。

这个模块依赖`deerflow.extensions.policy.project_host_policy`投影宿主策略。依赖`deerflow.extensions.model_access.ModelInvocationService`启动有模型授权的服务。

这个模块被`app.gateway.app`调用。Gateway的create_app在挂载完宿主路由后调用include_contributed_routers。生命周期在启动和关闭时调用start_services和stop_services。

这个模块依赖starlette和fastapi的路由内部结构。starlette是声明了的直接依赖。

## 四、重要性评级

评级是8分。

理由。这个模块是扩展和Gateway之间的正式接口。全部HTTP扩展路由都从这里挂载。全部Gateway扩展服务都从这里启停。

安全设计是这个模块最关键的部分。贡献路由本质是第三方代码注入HTTP表面。这个模块用证明式遮盖检测挡住了路由劫持。公共路径和CSRF豁免路径的保护是显式的安全边界。WebSocket路由在没有认证和Origin检查前直接拒绝。这些设计防止一个插件覆盖登录接口或webhook。

fail-open的生命周期设计也很关键。一个扩展服务坏了不能拖垮整个Gateway的启动和关闭。

不到10分的原因。没有扩展部署时这个模块全部短路。它是扩展功能的门户而不是Gateway主干。
