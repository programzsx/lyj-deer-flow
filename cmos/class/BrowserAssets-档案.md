# BrowserAssets档案

一、这个类是干什么的

BrowserAssets是版本化manifest和静态文件的数据类。文件在受信任的已安装包内。宿主在注册时校验并快照白名单文件。manifest里的相对路径相对root解析。绝不相对请求解析。这个类是frozen dataclass。

二、类的成员

（一）字段

- module：字符串。这个字段是模块标识名。
- root：字符串或Path。这个字段是静态文件的根目录。
- manifest：字符串。默认值是ui_manifest.json。这个字段是manifest文件名。
- public_fields：字符串元组。默认值是空元组。这个字段是允许投影给浏览器客户端的字段名。

（二）方法

- __post_init__：这个方法把public_fields转成元组。

三、它和谁协作

PluginContribution的frontend字段可以持有这个类。BrowserModule是另一种前端贡献形式。相对路径在manifest里解析。

四、重要性评级

评级：4分。

理由：这个类是插件静态资源的载体。宿主负责校验和快照。这个类只是声明。所以重要性偏低。
