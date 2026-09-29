# deerflow.config.tool_search_config-档案

## 一、这个模块是干什么的

这个模块管理延迟工具加载的配置。

MCP工具可能非常多。

所有工具的定义塞进上下文会浪费大量令牌。

开启延迟加载后，MCP工具不直接加载进上下文。

工具只按名字列在系统提示里。

模型需要时通过tool_search工具在运行时发现。

这个配置控制这个机制开不开。

## 二、模块里的主要成员

### 1、ToolSearchConfig类

两个字段。

`enabled`决定是否延迟工具并启用tool_search，默认关闭。

`auto_promote_top_k`是每次模型调用自动晋升的MCP工具定义上限，默认3。

自动晋升指从路由元数据里挑出最相关的工具，把它们的完整定义提前放进上下文。

### 2、自动晋升的钳制

`clamp_auto_promote_top_k()`把值钳制在1到5之间。

两个常量定义下限和上限。

字段校验器调用这个钳制函数。

全局MCP路由的自动晋升宽度被固定在这个范围。

### 3、单例函数

`get_tool_search_config()`返回当前配置单例。

`load_tool_search_config_from_dict()`在主配置加载时刷新单例。

## 三、它和谁协作

`app_config.py`的`tool_search`字段是这份配置。

延迟工具过滤中间件和tool_search工具消费这份配置。

`extensions_config.py`的MCP路由提示与之配合。

## 四、重要性评级

评级：5分。

理由：延迟加载是控制MCP工具上下文成本的核心机制。自动晋升的上限钳制是这里的关键设计。配置面小但影响面大。
