# _PluginAuthorizationUnavailable档案

来源文件：`backend/app/gateway/authz.py`

## 一、这个类是干什么的

这个类是插件授权路径的内部异常类。

这个类在插件授权提供方无法解析时被抛出。

无法解析的典型场景是`config.yaml`变得不可读，或者插件提供方实例化失败。

这个类是`_AuthorizationUnavailable`的插件版兄弟。

两个类的结构几乎一样。

两个类都携带`fail_closed`标志。

插件路径不复用`_AuthorizationUnavailable`的原因是两条路径的缓存机制不同。

路由提供方按配置对象身份缓存。

插件提供方按配置签名加事件循环缓存。

两条路径的失败来源不同，所以各自有独立的异常类。

## 二、类的成员

这个类继承自`Exception`。

这个类只有一个构造参数。

### 1、构造参数fail_closed

`fail_closed`是一个仅限关键字参数，类型是`bool`。

构造函数把`fail_closed`存到实例的同名属性上。

失败标志的取值有明确规则。

宿主机从未加载过配置就取真。

宿主机加载了配置但授权未启用就取假。

授权启用就跟随该配置自己的`fail_closed`。

## 三、它和谁协作

这个类由`resolve_plugin_authorization()`抛出。

这个类由`aresolve_plugin_authorization()`抛出。

捕获这个类的地方是`authorize_plugin_action_for_request()`。

`authorize_plugin_action_for_request()`按`fail_closed`决定抛403还是放行。

这个类的底层依赖是`deerflow.authz.runtime`的提供方解析函数。

## 四、重要性评级

评级：3分。

理由：这个类只在插件授权的失败路径出现。插件资源授权本身是较新的功能面。这个类结构极小，只有一个布尔字段。但这个类承载的失败策略决定插件请求的默认命运，方向错了会放行不该放行的请求。所以这个类是小而不可错的内部角色。
