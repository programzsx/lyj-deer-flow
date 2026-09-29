# deerflow_extension_api.settings 档案

## 一、这个模块是干什么的

这个模块定义"插件声明式设置"的契约。

插件可以声明一些部署参数。这些参数由部署安装的插件提供。不支持在线编辑。

设置不是代码加载API。设置也不是密钥存储。

设置的用途是让插件暴露可配置的行为参数。例如开关、数值、字符串。

## 二、模块里的主要成员

- `SettingValue`。设置值的类型。只能是bool、int、str。

- `SettingsField`。一个设置字段。包含键、标题、种类、默认值、描述、最小值、最大值、最大长度。种类限定boolean、integer、string。

- `FrontendBinding`。把设置绑定到可信的浏览器模块。浏览器模块在页面启动时加载。模块标识是名字。绝不是远程脚本URL。只有显式列出的非密钥字段才投影给已认证的浏览器客户端。

- `SettingsContribution`。一个插件的完整设置声明。包含命名空间、标题、字段列表、描述、scope、applies、前端绑定。

  - scope固定为deployment。声明式。部署级。

  - applies表示设置什么时候生效。next-run、page-load、next-request、request-and-page-load四种。

## 三、它和谁协作

它是本包的独立模块。只依赖标准库dataclasses和typing。

它被同包的`plugins.py`依赖。PluginContribution的settings_contribution()构造SettingsContribution。

宿主的设置系统消费声明。把声明的字段投影到对应的表面。

## 四、重要性评级

评级是2分。

理由如下。

它是纯数据形状定义。53行。没有任何运行时逻辑。

它对插件作者有价值。声明字段的形状决定插件怎么暴露配置。

安全约束写在文档里。设置不是密钥存储。前端只投影显式列出的字段。

扣分原因。体量小。纯声明式。没有行为。没有并发。没有持久化语义。它是整批模块里最简单的之一。
