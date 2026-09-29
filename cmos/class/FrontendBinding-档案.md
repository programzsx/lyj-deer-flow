# FrontendBinding档案

一、这个类是干什么的

FrontendBinding是把设置绑定到受信任浏览器模块的数据类。浏览器模块在页面启动时加载。模块标识是名字。绝不是远程脚本URL。只有显式列出的非秘密字段才投影给已认证的浏览器客户端。这个类是frozen dataclass。

二、类的成员

（一）字段

- module：字符串。这个字段是模块标识名。
- public_fields：字符串元组。这个字段是允许投影给浏览器的非秘密字段名。

（二）方法

- __post_init__：这个方法把public_fields转成元组。

三、它和谁协作

SettingsContribution的frontend字段是这个类的实例。PluginContribution的settings_contribution方法构造这个类。只有显式列出的字段会被投影。

四、重要性评级

评级：4分。

理由：这个类只有两个字段。它是设置和前端的绑定载体。非秘密投影逻辑靠字段列表保证。所以重要性偏低。
