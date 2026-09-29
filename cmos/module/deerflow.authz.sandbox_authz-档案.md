# deerflow.authz.sandbox_authz-档案

## 一、这个模块是干什么的

这个文件是沙箱执行授权的门槛。

它在沙箱使用之前检查authorize("sandbox", "execute")。

角色限定的策略可以完全拒绝沙箱执行。

拒绝时抛SandboxAuthorizationError。异常沿工具执行向上传播。agent的工具错误处理把它转换成友好的ToolMessage。比如"sandbox not permitted for your role"。不会让运行崩溃。

它镜像tool_filter和model授权的Principal/provider模式。沙箱路径和工具路径、模型路径共享一个身份来源。

沙箱的目标是星号哨兵。原因是沙箱是单个共享资源。不是像工具那样的命名目录。星号表示沙箱整体。RBAC的allow星号或allow true允许它。allow空列表或allow false拒绝它。

## 二、模块里的主要成员

### 1、safe_app_config和safe_app_config_async

safe_app_config加载全局AppConfig。不可用时返回None。

授权只能通过配置开启。没有可读配置意味着门槛是空操作。这保持了门槛在没有config.yaml的环境里安全。比如CI runner和直接调用的测试。get_app_config会抛FileNotFoundError。

safe_app_config_async把配置文件I/O放到线程池。不在事件循环上。

### 2、_resolve_authorization_inputs

这个函数解析启用的提供者和Principal。两个调用路径共享。

处理规则是这样的。

授权配置的enabled不是显式True时返回None。identity检查防Mock。

提供者解析失败遵循和authorize错误一样的fail_closed或fail_open决定。原始ValueError在fail_open下会被变成deny。语义反转。

fail_closed时抛SandboxAuthorizationError。fail-open时返回None。允许沙箱使用。

### 3、_resolve_authorization_inputs_async

这是异步版本。

provider为None时直接用同步解析器。没有模块要导入。保留missing-provider验证。不需要worker跳转。

provider存在时发现阶段放到线程池。构造阶段留在事件循环上。因为有效的异步提供者可能在__init__里创建事件循环绑定的客户端。

### 4、authorize_sandbox_execution

这是同步的检查入口。

app_config是None时当授权禁用。空操作。

解析输入。解析失败按fail_closed或fail-open处理。

调用provider的authorize。

决策不是AuthzDecision时抛TypeError。

allow为False时抛SandboxAuthorizationError。带角色。

其他异常看fail_closed。fail_closed抛SandboxAuthorizationError。fail-open返回。允许使用。

### 5、authorize_sandbox_execution_async

这是异步的检查入口。

上下文做快照。提供者发现可以导入自定义模块。放线程池。构造留在事件循环上。

然后调用aauthorize。决策处理和同步版相同。

## 三、它和谁协作

它依赖authz.principal里的build_principal_from_context。

它依赖authz.provider里的AuthzRequest。

它依赖authz.runtime里的解析函数。

它依赖sandbox.exceptions里的SandboxAuthorizationError。

它被沙箱工具和沙箱中间件调用。

## 四、重要性评级

评级是6分。

理由是这个文件是沙箱这个共享资源的授权门槛。

没有它，角色限定的策略无法拒绝沙箱执行。

fail_closed和fail-open的语义和工具路径保持一致。

异步路径的发现和构造分离是真实的坑。

不评更高分是因为沙箱是单个资源。检查逻辑比工具过滤简单。只有单次authorize调用。
