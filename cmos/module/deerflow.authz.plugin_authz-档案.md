# deerflow.authz.plugin_authz-档案

## 一、这个模块是干什么的

这个文件是插件资源的授权决策层。harness侧。

插件有三个入口点。注册的后端动作。声明的页面。企业贡献的管理路由。

三个入口点问同一个授权提供者。工具路径用的也是它。用同一个可信的Principal构建。

这个模块拥有决策。Gateway拥有请求作用域。公开的扩展守卫在extension_api里。

## 二、模块里的主要成员

### 1、统一语义

每个函数的语义是一致的。

授权配置的enabled不是显式True时空操作。允许。identity检查镜像tool_filter。Mock或SimpleNamespace配置不能把非布尔变成开启的门槛。

调用方提供app_config。调用方用它解析provider。这个模块从不自己读配置。配置文件在请求中途消失或解析失败不会被误判为禁用策略。

app_config是None意味着调用方完全读不到配置。不可用不等于禁用。检查fail closed。原因是允许放行的开关不可读。

调用方提供的provider被复用。一个请求只解析一次。

显式拒绝抛PluginAuthorizationError。

批量答案和它被问到的候选求交集。命名宿主没有提供的目标的提供者不能扩大投影。

提供者异常、解析失败、畸形判决、缺失Principal都遵循fail_closed。抛同样的错误。或者记警告并允许。这镜像沙箱和路由的语义。不是工具过滤的静默集合行为。

### 2、PluginAuthorizationError异常类

这是拒绝或fail_closed下无法回答时的错误。

携带resource、target、reason_code、fail_closed。

### 3、_validated_decision

这个函数拒绝不是AuthzDecision或allow不是真布尔的判决。

AuthzDecision是普通dataclass。自定义提供者可以返回allow为字符串false的判决。truthy字符串会被读成allow。畸形判决遵循fail_closed。

### 4、_deny_reason_code

这个函数提取拒绝的机器可读码。容忍坏的reasons。

判决仍是有效拒绝。只有原因码降级为authz.denied。提取从不抛异常。否则拒绝会变成未处理错误而不是配置的授权失败。

### 5、_enforce_single和_aenforce_single

这是单目标判决的同步和异步实现。

处理顺序是这样的。

取授权配置。app_config是None时fail closed。配置禁用时返回。

Principal是None时按fail_closed处理。

解析激活的provider。调用authorize或aauthorize。

验证判决。拒绝时抛PluginAuthorizationError。reason_code从判决提取。

### 6、公开函数

enforce_plugin_action对plugin_action做判决。允许或抛。

aenforce_plugin_action是异步版本。动作路由用。

enforce_plugin_management对plugin_management做读写判决。read和write是不同的target。

aenforce_plugin_management是异步版本。

afilter_plugin_pages返回plugin_page目标的可见子集。

afilter_plugin_management返回plugin_management目标的允许子集。

### 7、_afilter

这是批量过滤。

结果在每条路径上都是候选的子集。包括provider答案。filter_resources文档说只返回允许的子集。但它是自定义提供者的普通方法。答案可能命名从未被问到的目标。交集把它去掉。

filter_resources是同步方法。可能做阻塞工作。放到worker线程。

无候选时不做provider往返。这是投影的成本规则。

## 三、它和谁协作

它依赖authz.plugin_targets里的构造器。

它依赖authz.provider里的判决结构。

它依赖authz.runtime里的解析函数。

它被Gateway的插件路由和页面投影调用。

它被extensions的注册动作分发器调用。

## 四、重要性评级

评级是7分。

理由是这个文件是全部插件入口点的授权决策层。

统一语义让动作、页面、管理路由的授权行为一致。

fail_closed和fail-open的语义与沙箱和路由一致。

批量答案和候选求交集防止了投影扩大。

不评更高分是因为它是决策编排。策略本身在provider和rbac里。
