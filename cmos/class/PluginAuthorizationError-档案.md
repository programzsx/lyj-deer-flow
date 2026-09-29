# PluginAuthorizationError-档案

# 一、这个类是干什么的

PluginAuthorizationError定义在`backend/packages/harness/deerflow/authz/plugin_authz.py`。

这个类是一个异常类。这个类继承自`Exception`。这个类继承的是裸`Exception`。这个类不是`ValueError`的子类。

这个类表示"一个插件资源决策被拒绝，或在fail_closed下无法回答"。

要理解这个类。先要理解它所在模块的职责。

模块docstring说明了模块定位。

这个模块是插件资源的授权决策层。插件资源包括注册的后端动作、声明的页面、企业贡献的管理路由。

这些插件入口问的是同一个配置的`AuthorizationProvider`。工具路径也问同一个提供者。两者用同样的可信Principal构建。

这个模块拥有决策。Gateway拥有请求作用域。公共扩展守卫在`deerflow_extension_api.auth`里。

这个类的使用场景。

插件动作被拒绝时，模块抛这个异常。Gateway把异常转成403响应。

fail_closed为真且授权无法回答时，模块也抛这个异常。

无法回答的情况包括：配置读不到、提供者出错、没有操作者身份。

# 二、类的成员（字段、方法，各自做什么）

## （一）构造方法与字段

构造方法签名是`__init__(*, resource, target, reason_code, fail_closed=False)`。

四个关键字参数对应四个字段。

- `resource`：插件资源类型。类型是`str`。例如`"plugin_action"`、`"plugin_page"`、`"plugin_management"`。说明是哪类资源被拒。
- `target`：资源目标。类型是`str`。例如`"namespace/action_name"`。说明是哪个具体目标被拒。
- `reason_code`：机器可读的原因码。类型是`str`。例如`"authz.denied"`、`"authz.no_principal"`、`"authz.provider_error"`、`"authz.config_unavailable"`。调用方读这个码区分拒绝原因。
- `fail_closed`：是否因fail_closed而抛出。类型是`bool`，默认`False`。`True`表示这不是明确的拒绝。`True`表示授权无法回答。系统选择"宁可拒绝也不放行"。

构造方法调用`super().__init__`生成人类可读的消息。消息格式是"plugin authorization denied for {resource} '{target}' ({reason_code})"。

## （二）语义定位

这个异常有两种触发含义。

第一种含义是明确的拒绝。提供者给出了`allow=False`的决策。

第二种含义是无法回答。fail_closed为真时，无法回答也要抛这个异常。

调用方看`fail_closed`字段就能区分这两种含义。

# 三、它和谁协作

这个类是插件授权层的统一失败出口。

抛出方如下。

`_unanswerable`函数在fail_closed为真时抛这个异常。无法回答的情况包括没有Principal、提供者异常、配置不可用。

`_enforce_single`和`_aenforce_single`在决策拒绝时抛这个异常。拒绝时`reason_code`来自`_deny_reason_code`函数。

`_authorization_config`在配置读不到时抛这个异常。原因码是`authz.config_unavailable`。

消费方如下。

插件入口的调用方捕获这个异常。Gateway把异常转成403响应。

模块内部的辅助函数也识别这个异常。`_enforce_single`和`_aenforce_single`的异常处理里，`PluginAuthorizationError`被直接重新抛出。重新抛出让配置不可用的错误不被吞掉。

这个类与模块内的其他类的关系。

提供者决策来自`AuthzDecision`。决策的`allow`为假触发这个异常。决策的理由码变成异常的`reason_code`。

`_deny_reason_code`函数为异常提供`reason_code`。这个函数容忍坏的理由列表。理由列表读不出来时退回`authz.denied`。坏理由不能把拒绝变成500。

这个类自身不依赖任何deerflow类。这个类只依赖Python内置的`Exception`。

# 四、重要性评级（1-10分+理由）

评级：7分。

理由如下。

这个类是插件授权的统一失败出口。

没有它，插件授权的拒绝结果没有载体。

调用方无法区分"拒绝"和"无法回答"。

它的`reason_code`字段让Gateway能记录精确原因。

它的`fail_closed`字段让调用方区分两种触发含义。

明确的拒绝和系统故障导致的拒绝走同一个异常。同一个异常靠字段区分。这个设计让异常处理简单。

删掉它，插件授权层要换一种错误报告方式。

依赖它的地方包括：插件动作守卫、插件管理守卫、配置校验、Gateway的403转换。

插件授权的所有失败路径最终都落到这个异常。

评级不是满分，因为它是信号类。决策逻辑在别的函数里。但它是插件安全边界的必要出口。

所以给7分。
