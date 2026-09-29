# _AuthorizationUnavailable档案

来源文件：`backend/app/gateway/authz.py`

## 一、这个类是干什么的

这个类是授权模块的内部异常类。

这个类在授权提供方无法解析时被抛出。

无法解析的典型场景是配置读取失败，或者提供方实例化失败。

这个类携带一个`fail_closed`标志。

`fail_closed`标志告诉调用方该拒绝还是放行。

`fail_closed`为真就拒绝，`fail_closed`为假就退回旧的放行行为。

这个类存在的意义是避免调用方重新读配置。

配置读取本身已经失败了，再读一次没有意义。

所以失败标志随异常一起带走。

## 二、类的成员

这个类继承自`Exception`。

这个类只有一个构造参数。

### 1、构造参数fail_closed

`fail_closed`是一个仅限关键字参数，类型是`bool`。

构造函数把`fail_closed`存到实例的同名属性上。

这个类没有其他方法。

这个类没有其他字段。

## 三、它和谁协作

这个类由`_resolve_route_scoped_authorization()`抛出。

这个类由`resolve_model_authorization()`和`resolve_skill_authorization()`间接抛出。

捕获这个类的地方有三个。

`authorize_model_use()`捕获这个类，然后按`fail_closed`决定抛403还是放行。

`aresolve_plugin_authorization()`相关路径使用兄弟类`_PluginAuthorizationUnavailable`，逻辑平行。

模块内多个授权入口都依赖这个类传递失败策略。

## 四、重要性评级

评级：4分。

理由：这个类是授权失败路径的关键信令。授权系统的设计原则是失败策略要明确，这个类就是传递策略的载体。但这个类只在异常路径出现，正常请求永远碰不到这个类。这个类也没有任何业务逻辑。所以这个类是重要但小众的内部角色。
