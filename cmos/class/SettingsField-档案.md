# SettingsField档案

一、这个类是干什么的

SettingsField是插件设置字段的声明数据类。一个字段声明一个部署参数。值由部署安装的插件提供。不支持在线编辑。设置不是代码加载API。也不是密钥存储。这个类是frozen dataclass。

二、类的成员

（一）字段

- key：字符串。这个字段是设置键名。
- title：字符串。这个字段是设置的标题。
- kind：字面量。取值是boolean、integer或string。这个字段是值的类型。
- default：SettingValue。这个字段是默认值。SettingValue是布尔、整数或字符串。
- description：字符串。默认值是空字符串。这个字段是设置的描述。
- minimum：整数或None。默认值是None。这个字段是整数的最小值。
- maximum：整数或None。默认值是None。这个字段是整数的最大值。
- max_length：整数。默认值是256。这个字段是字符串的最大长度。

（二）方法

这个类没有自定义方法。这个类是纯声明类。

三、它和谁协作

PluginContribution的fields字段是这个类的元组。SettingsContribution的fields字段也是这个类的元组。宿主用声明渲染设置界面。

四、重要性评级

评级：4分。

理由：这个类是设置字段的声明载体。字段多但都是描述性元数据。所以重要性偏低。
