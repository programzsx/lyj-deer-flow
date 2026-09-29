# ActionContext档案

一、这个类是干什么的

ActionContext是后端动作的上下文数据类。宿主在每次接受的调用里提供当前设置和已认证的身份。后端动作运行在网关进程里。这里不是沙箱。这个类是frozen dataclass。

二、类的成员

（一）字段

- principal：ExtensionPrincipal。这个字段是调用者的已认证身份。
- settings：SettingValue的Mapping。这个字段是当前设置值。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

BackendAction的handler签名接收ActionContext。ToolContext继承这个类。ToolContext加上thread_id字段。ExtensionPrincipal是principal字段的类型。

四、重要性评级

评级：4分。

理由：这个类是扩展动作的参数载体。只有两个字段。本身没有行为。所以重要性偏低。
