# deerflow.capabilities.catalog

## 一、这个模块是干什么的

这个模块是能力目录的清单加载和校验。

背景是这样的。

系统有一个能力中心。

能力中心展示可安装的插件。

插件清单需要一套固定结构。

清单来自JSON文件。

加载时要校验。

这个模块定义清单的Pydantic模型。

定义加载函数。

它是独立于HTTP的。

独立于账户策略的。

独立于UI组件的。

它只管清单数据的形状。

清单模型有严格校验。

id有格式约束。

source必须是HTTPS。

图标必须是内置的插件资源。

图标不允许路径穿越、问号、井号。

分类和类型都是枚举。

不允许额外字段。

加载函数还有个规则。

操作员可以提供另一个清单文件。

加载永远不会执行可执行代码。

清单里只有数据。

## 二、模块里的主要成员

- PluginManifest：插件清单的Pydantic模型。extra=forbid。
- schema_version固定为1。
- id有格式约束，小写字母、数字、点、连字符，上限128字符。
- name、description、setup是多语言字典。
- category是六种分类之一。office、knowledge、research、business、development、custom。
- kind是三种类型之一。mcp、cli、native。
- source必须HTTPS开头。
- icon必须是/images/plugins/下的内置资源。
- load_catalog(path)：加载清单。默认读builtin.json。重复的插件id会报错。

## 三、它和谁协作

- 它被tools/tools.py引用。
- 它被能力中心的Gateway服务和前端消费。
- 它依赖Pydantic做校验。

## 四、重要性评级

评级是3分。

理由是它是能力目录的数据契约。

严格校验防住了恶意清单的常见形状。

HTTPS和图标约束是安全设计。

但它只是清单加载，不在执行路径上。

能力中心是可选功能。
