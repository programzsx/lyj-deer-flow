# ToolContext档案

一、这个类是干什么的

ToolContext是模型工具调用的宿主绑定身份数据类。这个类继承自ActionContext。这个类加上线程ID。资源所有权仍是插件提供者的责任。用principal的user_id。这个类是frozen dataclass。

二、类的成员

（一）字段

- thread_id：字符串或None。这个字段是工具调用发生的线程ID。

继承自ActionContext的字段：
- principal：ExtensionPrincipal。调用者的已认证身份。
- settings：SettingValue的Mapping。当前设置值。

（二）方法

这个类没有自定义方法。这个类是纯数据类。

三、它和谁协作

ActionContext是它的父类。ModelTool的handler签名接收ToolContext。宿主在每次模型工具调用时构造这个类传给handler。

四、重要性评级

评级：4分。

理由：这个类是工具调用的上下文载体。只在父类上加一个字段。所以重要性偏低。
