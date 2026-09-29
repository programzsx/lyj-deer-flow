# BrowserModule档案

一、这个类是干什么的

BrowserModule是自包含浏览器模块的数据类。插件用它贡献前端代码。相对资源要用BrowserAssets。这个类是frozen dataclass。

二、类的成员

（一）字段

- module：字符串。这个字段是模块标识名。
- code：字符串。这个字段是模块的代码内容。
- public_fields：字符串元组。默认值是空元组。这个字段是允许投影给浏览器客户端的字段名。

（二）方法

- __post_init__：这个方法把public_fields转成元组。保证不可变。

三、它和谁协作

PluginContribution的frontend字段可以持有这个类。BrowserAssets是另一种前端贡献形式。宿主在注册时校验并快照。

四、重要性评级

评级：4分。

理由：这个类是插件前端的代码载体。只有三个字段。所以重要性偏低。
