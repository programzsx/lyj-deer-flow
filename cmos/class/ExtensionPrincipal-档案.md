# ExtensionPrincipal档案

一、这个类是干什么的

ExtensionPrincipal是扩展贡献路由里调用者身份的数据类。这个类表示一个已认证的调用者。扩展路由用这个类判断调用者是谁。这个类是frozen dataclass。

二、类的成员

（一）字段

- user_id：字符串。这个字段是调用者的用户ID。
- is_admin：布尔值。默认值是False。这个字段表示调用者是不是管理员。
- is_internal：布尔值。默认值是False。这个字段表示调用者是不是内部调用。
- roles：字符串元组。默认值是空元组。这个字段是调用者的角色列表。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

resolve_principal从app.state读回这个类的实例。宿主在app.state上安装解析器。扩展路由在install时构造。那时还没有请求。所以身份在请求时才解析。ActionContext和ToolContext持有这个类。require_admin和require_plugin_management用这个类做授权判断。

四、重要性评级

评级：6分。

理由：这个类是扩展授权的基础。所有扩展路由的身份判断都靠它。fail closed的授权逻辑依赖它。所以重要性中等偏上。
