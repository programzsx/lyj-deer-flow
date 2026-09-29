# 模块档案：deerflow.community.searxng.tools

## 一、这个模块是干什么的

这个模块定义一个Agent工具。
工具名是web_search。
它用SearXNG搜索网页。
SearXNG是自托管的元搜索引擎。
聚合多个搜索引擎的结果。
使用它需要用户自己部署一个SearXNG实例。
默认地址是http://localhost:8088。
从config.yaml的base_url可以覆盖。
它支持时间范围参数。
取值是day、week、month、year。
直接透传给SearXNG。

## 二、模块里的主要成员

（1）web_search_tool
这是唯一的Agent工具。
它是一个异步工具。
参数有query和time_range。
max_results默认5。
从配置里可覆盖。
配置值先尝试直接当整数。
不行再int转换。
转换失败打警告并保留默认。
工具构建SearxngClient。
调用search方法。
结果归一化成title、url、snippet结构。
snippet来自SearXNG的content字段。
返回JSON。

（2）_get_searxng_client
这个函数构建客户端。
base_url从web_search工具配置里取。
默认http://localhost:8088。

（3）_get_tool_config
这个函数安全地取工具配置的extra字段。
配置不存在返回None。
model_extra是None时返回空字典。

## 三、它和谁协作

这个模块依赖谁。
依赖同目录的searxng_client模块。
依赖search_time_range模块的SearchTimeRange类型。
依赖deerflow.config。

谁调用这个模块。
DeerFlow的工具框架把它注册成Agent的web_search工具。
config.yaml的tools列表里配置web_search用这个提供商才启用。
它是支持时间范围的五个搜索提供商之一。

## 四、重要性评级

评级：4分。
理由：这是SearXNG自托管搜索的工具层。代码只有73行。工具本身是薄封装。客户端承担了翻页和去重的复杂逻辑。它支持时间范围参数。是少数自托管方案之一。部署成本是维护一个SearXNG实例。给4分。
