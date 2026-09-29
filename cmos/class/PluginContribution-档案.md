# PluginContribution档案

一、这个类是干什么的

PluginContribution是插件贡献的总声明数据类。一个受信任的包用它声明全部贡献。一个身份、一个启用开关、可选设置和实现。宿主拥有enabled字段。其他字段是非秘密设置。至少提供一种贡献。前端模块、后端动作或模型工具。后端实现通过运维控制的Python加载器安装。这个类是frozen dataclass。

二、类的成员

（一）字段

- namespace：字符串。这个字段是插件的命名空间。
- title：字符串。这个字段是插件的标题。
- description：字符串。默认值是空字符串。这个字段是插件的描述。
- enabled：布尔值。默认值是False。这个字段是启用开关。宿主拥有这个字段。
- fields：SettingsField元组。默认值是空元组。这个字段是插件的设置字段声明。
- frontend：BrowserModule或BrowserAssets或None。默认值是None。这个字段是前端贡献。
- backend：BackendAction元组。默认值是空元组。这个字段是后端动作贡献。
- api_version：整数。默认值是1。这个字段是API版本。
- tools：ModelTool元组。默认值是空元组。这个字段是模型工具贡献。

（二）方法

- __post_init__：这个方法把fields、backend和tools转成元组。
- settings_contribution：这个方法构造SettingsContribution。包括enabled开关和声明的字段。applies根据贡献类型推导。有前端加后端或工具是request-and-page-load。只有后端或工具是next-request。只有前端是page-load。

三、它和谁协作

ExtensionRegistry的plugin方法接收这个类。BrowserModule、BrowserAssets、BackendAction、ModelTool和SettingsField是它的字段类型。ExtensionService通过注册表接收贡献。宿主的插件加载器在install时构造这个类。

四、重要性评级

评级：7分。

理由：这个类是插件体系的总入口。插件的所有能力都从它声明。settings_contribution推导生效策略。所以重要性中上。
