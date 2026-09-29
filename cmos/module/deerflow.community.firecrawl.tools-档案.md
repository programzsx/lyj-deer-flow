# 模块档案：deerflow.community.firecrawl.tools

## 一、这个模块是干什么的

这个模块定义两个Agent工具。
一个工具叫web_search。
另一个工具叫web_fetch。
底层是Firecrawl。
Firecrawl是一个网页抓取和数据提取服务。
它提供异步Python客户端AsyncFirecrawlApp。
使用它需要API key。
这个模块和fastcrw模块很像。
两者结构几乎一样。
区别只在客户端类和base URL的处理。
fastcrw复用Firecrawl客户端换地址。
这个模块直接用Firecrawl自己的异步客户端。

## 二、模块里的主要成员

（1）web_search_tool
这是web_search工具。
参数只有query。
max_results默认5。
从配置里可覆盖。
调用AsyncFirecrawlApp的search方法。
结果里result.web是结果对象列表。
归一化成title、url、snippet结构。
返回JSON。
用getattr兜底取字段。
字段缺失返回空字符串。

（2）web_fetch_tool
这是web_fetch工具。
参数只有url。
调用AsyncFirecrawlApp的scrape方法。
formats指定markdown。
返回标题加markdown正文。
正文截断到4096字符。
标题从metadata里取。
取不到用Untitled。
没有内容返回错误。

（3）_get_firecrawl_client
这个函数构建客户端。
API key和base_url从配置取。
base_url配置了才传。
没配置用SDK默认。

## 三、它和谁协作

这个模块依赖谁。
依赖firecrawl库的AsyncFirecrawlApp。
依赖deerflow.config。
它不依赖url_safety。
因为抓取动作由Firecrawl云服务执行。
DeerFlow不直接抓取。

谁调用这个模块。
DeerFlow的工具框架把它注册给Agent。
config.yaml的tools列表里配置了才启用。

## 四、重要性评级

评级：3分。
理由：这是一个标准薄封装的可选提供商。80行。就是Firecrawl SDK的直接映射。没有SSRF校验。没有复杂的配置防御。它是Firecrawl云服务的适配层。功能单一。给3分。
