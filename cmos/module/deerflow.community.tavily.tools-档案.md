# 模块档案：deerflow.community.tavily.tools

## 一、这个模块是干什么的

这个模块定义两个Agent工具。
一个工具叫web_search。
一个工具叫web_fetch。
底层是Tavily。
Tavily是一个AI搜索API。
它提供Python SDK，就是AsyncTavilyClient。
使用它需要API key。
API key从config.yaml的工具配置里取。
取不到时SDK自己回退到TAVILY_API_KEY环境变量。
web_search支持时间范围。
支持包含和排除域名。
web_fetch抓取单个页面。
返回正文。

## 二、模块里的主要成员

（1）web_search_tool
这是web_search工具。
它是一个异步工具。
参数有query和time_range。
time_range是可选的相对时间窗口。
取值是day、week、month、year。
直接透传给Tavily。
max_results默认5。
从配置里可覆盖。
include_domains和exclude_domains从配置里透传。
只有配置里存在时才传。
显式的空列表要保留。
空列表表示明确不限制那一类。
而不是忽略。
include_domains非空时。
显式发送include_domains_mode等于filter。
包含列表必须是限制来源。
而不是加权。
省略模式当include列表缺失或为空。
这些是部署级的搜索来源设置。
模型可见的签名只有query和time_range。

（2）web_fetch_tool
这是web_fetch工具。
参数只有url。
调用client的extract方法。
提取结果保证有URL和内容。
但不保证有页面标题。
标题回退分三层。
先取result的title。
再取result的url。
最后取请求的url。
返回标题加raw_content。
raw_content截断到4096字符。
failed_results非空时返回第一个错误。

（3）_get_tavily_client
这个函数构建客户端。
凭据按工具名选择。
web_search默认用web_search配置。
web_fetch显式传web_fetch配置。
配置里有api_key才传。
否则SDK回退到环境变量。

（4）客户端生命周期
每个工具拥有每次调用的异步客户端。
在finally里await close()。
包括请求失败和取消。
finally保证失败路径也关闭连接池。

## 三、它和谁协作

这个模块依赖谁。
依赖tavily库的AsyncTavilyClient。
依赖search_time_range模块的SearchTimeRange类型。
依赖deerflow.config。

谁调用这个模块。
DeerFlow的工具框架把这两个工具注册给Agent。
config.yaml的tools列表里配置了才启用。
仓库的测试在tests/test_tavily_tools.py。
测试用真实的helper和SDK构造器。
只mock搜索和提取调用。

## 四、重要性评级

评级：4分。
理由：这是Tavily AI搜索的可选提供商。它支持时间范围和域名过滤。include_domains_mode等于filter的细节很重要。不显式发送的话包含列表会变成加权而不是限制。仓库的AGENTS.md专门用一节描述它的凭据选择和生命周期规则。它是可选集成。给4分。
