# PluginManifest-档案

## 一、这个类是干什么的

PluginManifest是capabilities/catalog.py里的pydantic模型。

它是验证过的插件清单。

独立于HTTP、账户策略和UI组件。

插件清单描述可安装的MCP、CLI或原生插件。

它来自builtin.json。

操作员可以提供别的清单文件。

这个类位于backend/packages/harness/deerflow/capabilities/catalog.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、PluginManifest字段

model_config是extra="forbid"。未知字段拒绝。

schema_version固定为1。

id必须匹配^[a-z0-9][a-z0-9.-]*$。上限128。

version上限80。

name、description、setup是多语言字典。

category是office、knowledge、research、business、development、custom之一。

kind是mcp、cli、native之一。

adapter必须匹配^[a-z][a-z0-9_-]*$。

source是插件来源。

icon可选。

aliases是别名列表。

auth_methods是none、api_key、oauth之一。

contributions是tools、skills之一。

config_schema默认是object类型schema。

### 2、验证器

safe_source验证source必须HTTPS。

local_icon验证icon必须是打包的插件资源。

必须以/images/plugins/开头。

不能含..、?、#。

### 3、load_catalog函数

load_catalog加载清单文件。

默认是builtin.json。

操作员可以提供另一个清单文件。

永不加载可执行代码。

加载后检查id重复。

重复时抛ValueError。

### 4、runtime.py的过滤

installation_id生成稳定安装引用。

有capability元数据id时用它。

否则用UUID5命名空间从server_name生成。

已有配置在GET时不改写。名字是现有不可变运行时键。

ambiguous_installation_ids找模糊id。

禁用条目也算。

启用一个永远不能拓宽另一个选择。

filter_mcp_plugins按选中安装过滤MCP工具。

模糊id从wanted里去掉。

## 三、它和谁协作

- builtin.json是内置清单。
- capabilities/runtime.py用installation_id做工具选择。
- extensions_config的mcp_servers提供服务器配置。
- mcp_metadata识别工具来源。

## 四、重要性评级

评级是5分。

理由如下。

这个类是插件目录的验证边界。

extra=forbid防止未知字段。

source必须HTTPS。icon必须是打包资源。

目录加载永不执行代码。

安装id的稳定引用让工具选择不漂移。

模糊id从选择中剔除防止意外拓宽。

这些安全设计不错。

扣掉5分。

扣分原因是它是目录元数据。

不在执行路径上。
