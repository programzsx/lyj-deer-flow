# SettingsContribution档案

一、这个类是干什么的

SettingsContribution是插件设置贡献的数据类。这个类描述一个插件命名空间声明的全部设置。设置是部署级的。不是密钥存储。这个类是frozen dataclass。

二、类的成员

（一）字段

- namespace：字符串。这个字段是插件命名空间。
- title：字符串。这个字段是设置块的标题。
- fields：SettingsField元组。这个字段是声明的设置字段。
- description：字符串。默认值是空字符串。这个字段是设置块的描述。
- scope：字面量。取值是deployment。默认值是deployment。这个字段固定了设置的作用域。
- applies：字面量。取值是next-run、page-load、next-request或request-and-page-load。默认值是next-run。这个字段表示设置变更什么时候生效。
- frontend：FrontendBinding或None。默认值是None。这个字段是设置到前端的绑定。

（二）方法

- __post_init__：这个方法把fields转成元组。

三、它和谁协作

PluginContribution的settings_contribution方法构造这个类。SettingsField和FrontendBinding是这个类的字段类型。宿主用这个类渲染设置界面。

四、重要性评级

评级：4分。

理由：这个类是插件设置的声明载体。字段都是描述性元数据。applies决定生效时机。所以重要性偏低。
