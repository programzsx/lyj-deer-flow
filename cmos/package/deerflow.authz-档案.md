# deerflow.authz-档案

## 一、这个包是干什么的

这个包是DeerFlow的"细粒度授权"包。

包名是`deerflow.authz`。源码在`backend/packages/harness/deerflow/authz/`。

大白话讲。鉴权回答"你是谁"。授权回答"你能干什么"。这个包做的是第二件事。它决定某个角色能不能用某个工具、能不能执行沙箱、能不能访问某个插件资源。

这个包的docstring说明了定位。它是"可插拔的细粒度授权"。它做资源级的RBAC，也能扩展到RBAC之外。

这个包的来源写在`provider.py`的docstring里。PR #3665把guardrails限定在执行时检查。那次PR明确说不新增policy engine和RBAC系统。这个包就是那次PR推迟的RBAC大脑。

这个包在两层强制执行同一个策略。

第一层是装配时过滤。角色永远用不到的工具在绑定给agent之前就被移除。模型看不到它们。`tool_search`也永远无法把它们升级回来。这一层是fail-closed的。

第二层是运行时拒绝。工具调用时再问一次策略。这一层复用guardrails的中间件，通过一个薄适配器接入。

## 二、包里的主要成员

### 1、provider.py

这个模块定义协议和数据结构。它是策略的大脑。

- `Principal`。执行者。字段有user_id、role、oauth_provider、oauth_id、channel_user_id、is_internal、attributes。字段和Gateway注入运行上下文的身份形状一致。
- `AuthzRequest`。一次授权检查的输入。字段有principal、resource、action、target、context。resource是"tool"、"model"、"sandbox"这类。action是"call"、"execute"、"read"这类。target是具体资源名。
- `AuthzReason`。结构化的理由。有code和message。
- `AuthzDecision`。策略的裁决。allow加reasons加policy_id。
- `AuthorizationProvider`。协议。任何有这三个方法的类都行。不需要基类。三个方法是`authorize()`、`aauthorize()`、`filter_resources()`。`filter_resources()`是批量可见性过滤。要求实现是线程安全的。

resource、action、target是自由字符串，不是枚举。这样新增资源类型不需要改schema。

### 2、principal.py

这个模块是Principal的唯一合法构造点。

- `build_principal_from_context()`。从运行上下文构建Principal。纯函数。无全局配置读。无缓存。无输入变异。user_role缺失或为空时用default_role。未知但非空的角色不会被替换。
- `normalize_authz_attributes()`。校验和复制authz_attributes。非Mapping会抛TypeError。这是所有传播点共享的规范化点。

第一层工具装配和第二层适配器都必须用这个builder。这样身份语义保持一致。

### 3、rbac.py

这个模块是内置的RBAC provider。

- `RbacAuthorizationProvider`。从配置读角色到资源的映射。构造时把策略编译成不可变结构。
- `_CompiledPolicy`。单个（角色，资源）对的已编译策略。deny永远赢过allow。
- `validate_role()`。角色未定义时快速失败。

配置样例写在docstring里。admin允许所有工具。user允许所有工具但禁用update_agent。guest只允许两个工具。

校验非常严格。未知配置键被拒绝。null的allow被拒绝。未知角色抛ValueError而不是静默allow。这保证fail_closed能做最终决定。

### 4、runtime.py

这个模块是provider工厂。两阶段API。

- `resolve_authorization_provider_spec()`。发现阶段。按类路径解析provider类。这个阶段可能导入自定义模块。可以卸载到事件循环外。
- `construct_authorization_provider()`。构造阶段。实例化并校验。RBAC provider会额外校验default_role。
- `resolve_authorization_provider()`。同步便捷函数。组合两个阶段。

实例不缓存。一次agent构建解析一次，同一实例传给两层。

### 5、enforcement.py和tool_filter.py

这两个模块服务第一层。

- `filter_tools_by_authorization()`。返回策略可见的工具子集。不改变顺序。provider报错且fail_closed时清空全部工具。显式fail-open时保留原集合。
- `apply_tool_authorization()`。便捷封装。组合provider解析、Principal构建、工具过滤。三条装配路径（主agent、子agent、嵌入式客户端）保持一行调用。返回过滤后的工具和provider实例。provider实例传给第二层。这样两层共享同一个实例。

### 6、adapter.py

这个模块是适配器。`GuardrailAuthorizationAdapter`把`AuthorizationProvider`包装成`GuardrailProvider`。

这样现有的`GuardrailMiddleware`就能强制执行authz决策。不需要新建中间件类。适配器把GuardrailRequest字段映射成AuthzRequest。把AuthzDecision映射回GuardrailDecision。

有一个`infrastructure_tool_names`概念。框架工具从已经过滤的能力集合创建。这些工具可以跳过第二次provider裁决。这避免双重检查。

provider异常被故意放行。因为`GuardrailMiddleware`已经根据fail_closed参数处理了。在这里捕获会重复逻辑并可能产生分歧。

### 7、sandbox_authz.py

这个模块是沙箱执行授权门。

在沙箱使用前检查`authorize("sandbox", "execute")`。拒绝时抛`SandboxAuthorizationError`。agent的工具错误处理把它转换成友好的ToolMessage。运行不会崩溃。

沙箱是单一共享资源。target是哨兵`*`。RBAC的`allow: true`允许它。`allow: false`拒绝它。

配置不可读时（比如CI环境没有config.yaml），这个门是无操作。这是刻意的fail-open。

### 8、plugin_authz.py和plugin_targets.py

这两个模块服务插件资源授权。

`plugin_targets.py`定义target的规范编码。target是`"{namespace}/{part}"`形式。三个构造函数分别服务action、page、management。任何调用点不允许字符串拼接。构造函数校验失败时抛`PluginTargetError`而不是返回尽力而为的字符串。读和写是不同的target。因为内置RBAC provider忽略action字段。读写权限靠不同target区分。

`plugin_authz.py`是harness侧的决策层。覆盖三类资源。注册的后端动作（`plugin_action`）、声明的页面（`plugin_page`）、管理路由（`plugin_management`）。

语义要点：

- 授权未启用就是无操作（允许）。
- `app_config=None`表示调用方读不到配置。这是"不可用"，不是"已禁用"。检查fail-closed。
- 显式拒绝抛`PluginAuthorizationError`。
- 批量答案和候选列表求交集。provider点名一个host没提供的目标不能扩大投影。
- provider异常、畸形决策、缺失principal按fail_closed处理。
- 拒绝的reasons读不了时，裁决不变，只有reason_code降级。坏的reason列表永远不能把拒绝变成允许或500。

### 9、outcome.py

这个模块是中立的Guardrail到observer的授权结果契约。

`GuardrailMiddleware`把`AuthorizationOutcome`写进运行上下文。observer弹出它来记录是哪个策略裁决了某次工具调用。两边互不导入。上下文键带双下划线前缀。Gateway会剥离调用方伪造的`__`键。

存储有上限。最多500条。没有observer的run永远不弹出条目。加上限把增长约束在固定足迹内。最旧的条目先被淘汰。

## 三、它和谁协作

### 1、上游调用方

- `deerflow.guardrails.middleware`。导入outcome和principal。GuardrailMiddleware写授权结果。
- `deerflow.agents.lead_agent.agent`。第一层工具装配和模型名授权。
- `deerflow.client`。嵌入式客户端的工具装配。
- `deerflow.subagents.executor`、`acceptance_checks`、`batch_acceptance`。子agent侧授权。
- `deerflow.sandbox.tools`、`sandbox.middleware`。沙箱执行门。
- `deerflow.tools.builtins.task_tool`、`batch_task_tool`。authz_attributes传播。
- `deerflow.agents.middlewares.view_image_middleware`、`tool_error_handling_middleware`。
- `app.gateway.app`、`app.gateway.authz`、`app.gateway.routers.thread_runs`、`artifacts`。Gateway侧插件授权和路由权限。

### 2、下游依赖

- `deerflow.guardrails`。协议形状和数据结构对齐。适配器把决策喂给GuardrailMiddleware。
- `deerflow.config.authorization_config`。AuthorizationConfig。
- `deerflow.reflection`。resolve_variable按类路径加载provider。
- `deerflow.sandbox.exceptions`。SandboxAuthorizationError。

### 3、配置

配置在`config.yaml`的`authorization`键下。配置例子在`config.example.yaml`里有。`enabled`开启。`provider.use`指向类路径。`provider.config`传给构造函数。`default_role`兜底角色。`fail_closed`失败策略。

### 4、测试

测试覆盖很广。大约25个测试文件引用这个包。包括test_rbac_authorization_provider、test_authorization_runtime、test_authorization_tool_filter、test_authorization_principal、test_plugin_targets、test_plugin_action_authorization、test_plugin_management_guard、test_sandbox_authorization等。还有blocking_io目录下的3个。

## 四、重要性评级

评级是8分。

理由如下。

引用数量查证结果。全仓库约63个文件引用`deerflow.authz`。其中生产代码约20处。测试约25个文件。文档和配置若干。

这个包是授权安全的关键路径。启用授权后，工具可见性、工具执行、沙箱执行、插件资源、模型选择全部经过它。它有两个强制层。装配时过滤决定模型能看到什么。运行时拒绝决定调用能否继续。

删除它会怎样。所有`from deerflow.authz`的导入会立刻失败。涉及的文件包括lead_agent、client、subagents、sandbox、guardrails、Gateway的app和routers。系统无法启动。想摘掉它需要改动约20个生产文件。

为什么是8分不是10分。它受`authorization.enabled`开关保护。默认关闭。关闭时`apply_tool_authorization`直接返回原工具集合，`filter_tools_by_authorization`在provider为None时直接返回原列表。所以默认部署里它是惰性的。它不像runtime或config那样是系统运行的绝对前提。但在启用授权的部署里，它是唯一的安全裁决层，缺了它等于没有权限控制。
