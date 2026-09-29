# AdapterRegistry档案

来源文件：`backend/app/gateway/capabilities.py`

## 一、这个类是干什么的

这个类是能力适配器的注册表。

能力中心支持多种能力来源，比如MCP服务器、业务连接、Lark集成、技能。

每种来源有一个适配器。

这个类的职责是给适配器起名字、存名字、按名字查。

模块在底部创建了模块级单例`registry`。

单例注册了四个适配器。

`mcp`对应`MCPAdapter`。

`business`对应`BusinessAdapter`。

`lark`对应`LarkAdapter`。

`skills`对应`SkillAdapter`。

这个类的存在让能力安装接口不需要写if分支。

查到哪个适配器就用哪个。

## 二、类的成员

### 1、方法__init__

`__init__`创建一个空的内部字典`_adapters`。

字典的键是适配器名字，值是适配器实例。

### 2、方法register

`register`接收名字和适配器实例。

`register`把适配器存进字典。

重名注册会抛`ValueError`。

这个约束防止后来的适配器悄悄覆盖已有的适配器。

### 3、方法get

`get`按名字查适配器。

查不到时抛HTTP 422异常。

异常信息说这个能力只有安装指引，没有可用的安装适配器。

这个语义支持"仅展示指引、不支持一键安装"的能力。

## 三、它和谁协作

这个类的模块级单例`registry`被`list_installations()`顶层函数使用。

这个类持有`MCPAdapter`、`BusinessAdapter`、`LarkAdapter`、`SkillAdapter`四个实例。

这个类依赖`CapabilityAdapter`协议作为类型约束。

路由层通过`list_installations()`间接使用这个类。

## 四、重要性评级

评级：5分。

理由：这个类是能力中心的分发中枢。所有安装能力请求都经过这个类的`get()`方法。这个类的重名保护和查不到时的422语义都是刻意的安全设计。但这个类只有十来行逻辑，结构简单。所以这个类是简单但承重的基础设施。
