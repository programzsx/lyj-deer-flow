# RbacAuthorizationProvider-档案

# 一、这个类是干什么的

RbacAuthorizationProvider定义在`backend/packages/harness/deerflow/authz/rbac.py`。

这个类是内置的基于角色的授权提供者。RBAC就是Role-Based Access Control。

模块docstring说明了这个类的职责。

这个类从配置读取角色到资源的策略。这个类在构造时把策略编译成不可变结构。

拒绝永远赢过允许。

未知或缺失的角色会抛`ValueError`。抛错不是静默允许。抛错让执行层的`fail_closed`做最终决定。

这个类是`AuthorizationProvider`协议的内置实现。这个类满足协议但不需要继承任何基类。

这个类在什么场景被使用。

部署方在`config.yaml`里配置`authorization.provider.use`指向这个类。

配置示例。

admin角色的tools允许所有。

user角色的tools允许所有但拒绝`update_agent`。

guest角色的tools只允许`web_search`和`read_file`。

这个类是两层授权机制的策略来源。第一层组装过滤和第二层执行判断都靠这个类回答。

docstring提到完整的语义表在`docs/plans/2026-07-15-authz-phase1a-implementation-plan.md`第3.3节。

# 二、类的成员（字段、方法，各自做什么）

## （一）字段

- `name`：提供者名称。类属性。值是`"rbac"`。
- `_policies`：编译后的策略字典。实例属性。键是`（role_name, resource_key）`元组。值是`_CompiledPolicy`对象。
- `_known_roles`：已知角色集合。类型是`frozenset[str]`。用于校验角色。

## （二）方法

- `__init__(*, roles, **kwargs)`：构造方法。输入是`roles`配置字典。构造时做全面校验和编译。校验内容包括：不接受未知配置键。缺少必需的`roles`键会报错。`roles`必须是字典。角色名必须是非空字符串。角色配置必须是字典。资源键必须是有效字符串。资源键如果是保留别名（例如用`tool`而不是`tools`）会报错。校验通过后编译每个资源策略。
- `validate_role(role, *, field)`：快速校验角色。输入是角色名。角色未定义就抛`ValueError`。错误消息列出所有已知角色。这个方法用于操作者配置的角色校验。
- `_compile_resource_policy(role_name, resource_key, policy)`：静态方法。编译单个资源策略。校验内容包括：未知键拒绝（抓住`alow`这类拼写错误）。`allow`支持`"*"`、布尔、字符串列表。`allow`为`None`拒绝。`allow`缺失表示允许所有（拒绝列表仍然生效）。`allow: false`表示全部拒绝。`deny`必须是字符串列表。`deny`为`None`拒绝。最终返回`_CompiledPolicy`。
- `_resolve_policy(principal, resource, *, resource_field)`：查找（角色，资源类型）对应的编译策略。没有配置策略返回`None`。`None`表示不受限。角色缺失或未知抛`ValueError`。资源标识无效抛`ValueError`。查找时会做资源键映射。例如`"tool"`映射到`"tools"`。映射表是`_RESOURCE_POLICY_KEYS`。映射表防止静默查错键。
- `authorize(request: AuthzRequest) -> AuthzDecision`：评估单个授权请求。流程是先解析策略。没有策略就返回允许，策略标识是`rbac:unrestricted`。有策略就调用`is_allowed`判断。允许返回`rbac:allow`。拒绝返回`rbac:deny`加具体理由。
- `aauthorize(request)`：异步版本。直接调用同步的`authorize`。
- `filter_resources(principal, resource_type, candidates) -> list[str]`：批量可见性过滤。保留候选顺序和重复项。绝不添加新项。角色或资源错误和`authorize`一致。没有策略时原样返回候选列表。有策略时逐个过滤。

模块级还有一个重要常量`_RESOURCE_POLICY_KEYS`。

这个映射把请求的`resource`（单数，如`"tool"`）映射到配置键（复数，如`"tools"`）。

映射防止静默查错。

映射还包含插件资源。`plugin_action`映射到`plugin_actions`。`plugin_management`自映射。

没有映射的资源不受限。不受限是非破坏性路径。这方便部署方开启授权但不列这些键。

# 三、它和谁协作

这个类是授权体系的内置策略执行者。

上游关系如下。

`runtime.py`里的`construct_authorization_provider`构建这个类。构建时校验实例满足`AuthorizationProvider`协议。构建时还会调用`validate_role`校验`default_role`配置。

下游关系如下。

这个类依赖`Principal`、`AuthzRequest`、`AuthzDecision`、`AuthzReason`。这四个类都在`deerflow/authz/provider.py`里。

这个类依赖内部的`_CompiledPolicy`做判断。

消费关系如下。

`GuardrailAuthorizationAdapter`持有授权提供者实例。工具调用时适配器调用提供者的`authorize`/`aauthorize`。

`plugin_authz.py`里的函数也调用提供者。插件资源检查走同样的协议。

组装层调用`filter_resources`做第一层过滤。

继承关系上，这个类没有基类。这个类通过方法签名隐式满足`AuthorizationProvider`协议。

# 四、重要性评级（1-10分+理由）

评级：9分。

理由如下。

这个类是授权体系的默认策略执行者。

没有这个类，授权系统只有协议没有实现。

没有这个类，`config.yaml`里的角色策略无法生效。

两层授权机制都靠这个类回答。第一层靠`filter_resources`。第二层靠`authorize`。

插件授权层也走这个类。

这个类的校验逻辑非常严格。严格校验防止静默错误授权。

删掉它，授权功能退化为只有协议。部署方要自己实现提供者。

依赖它的地方包括：运行时构建、适配器、插件授权层、配置校验。

评级不给满分，因为这个类是可选实现。部署方可以换成自定义提供者。协议和调用方不依赖这个具体类。

但作为内置默认实现，它的地位非常高。所以给9分。
