# Principal-档案

# 一、这个类是干什么的

Principal定义在`backend/packages/harness/deerflow/authz/provider.py`。

这个类表示"操作者"。操作者就是发起请求的人或服务。

授权系统要先知道"谁在请求"。

然后授权系统才能判断"这个人能不能做这件事"。

Principal就是这个"谁"。这个类把操作者的身份信息装在一个数据对象里。

模块docstring说明了这个类的来源。

身份字段镜像了`inject_authenticated_user_context`的输出。这个函数在`app/gateway/services.py`里。这个函数已经把身份信息写入运行上下文。所以授权提供者看到的是同一种身份形状。

第一层工具组装过滤和第二层执行时守卫适配器都用`build_principal_from_context`构建这个对象。

适配器每次请求都重新构建Principal。

适配器不缓存身份信息。

不缓存是为了避免拿到过期的身份。

这个类是一个dataclass。这个类只装数据。这个类没有任何业务方法。

# 二、类的成员（字段、方法，各自做什么）

## （一）字段

- `user_id`：用户ID。类型是`str | None`，默认`None`。这是操作者在DeerFlow里的用户标识。
- `role`：角色名。类型是`str | None`，默认`None`。这是RBAC判断的核心字段。RBAC提供者靠这个字段查策略。这个字段为空时RBAC会报错。
- `oauth_provider`：OAuth提供者名称。类型是`str | None`，默认`None`。例如GitHub、Google这类外部身份来源。
- `oauth_id`：OAuth身份ID。类型是`str | None`，默认`None`。这是用户在外部身份系统里的标识。
- `channel_user_id`：渠道用户ID。类型是`str | None`，默认`None`。这是IM渠道（飞书、Slack等）里的用户标识。
- `is_internal`：是否内部调用者。类型是`bool`，默认`False`。内部调用者享有服务端信任的上下文。
- `attributes`：附加属性字典。类型是`dict[str, Any]`，默认空字典。这里放自定义提供者需要的额外身份属性。

## （二）方法

这个类没有定义任何方法。

这个类是纯数据类。所有判断逻辑都在授权提供者里。

# 三、它和谁协作

Principal被授权系统里的几乎每个环节使用。

调用关系如下。

`build_principal_from_context`函数（在`deerflow/authz/principal.py`里）负责从运行上下文构建Principal。

`RbacAuthorizationProvider`读取Principal的`role`字段来查策略。

`GuardrailAuthorizationAdapter`在每次工具调用时重新构建Principal。

`AuthzRequest`携带一个Principal实例。授权请求必须带上操作者身份。

`enforce_plugin_action`等插件授权函数也接收Principal参数。

组合关系上，Principal是AuthzRequest的一个字段。

Principal本身不依赖其他类。Principal是被依赖的一方。

# 四、重要性评级（1-10分+理由）

评级：8分。

理由如下。

这个类是整个授权体系的身份基础。

没有Principal，授权提供者不知道"谁在请求"。

没有Principal，RBAC无法查角色策略。

没有Principal，插件授权无法执行。

Principal被两层授权机制共用。第一层是工具组装过滤。第二层是运行时执行判断。

Principal本身很小。删掉它会导致授权模块全面不可编译。

依赖它的地方很多。提供者、适配器、插件授权函数、构建函数都依赖它。

评级不是满分，因为Principal只是被动数据载体。真正做决策的是提供者。数据类的重要性取决于使用它的逻辑。Principal的使用面很广，所以给8分。
