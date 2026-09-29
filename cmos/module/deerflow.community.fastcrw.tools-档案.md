# 模块档案：deerflow.community.fastcrw.tools

## 一、这个模块是干什么的

这个模块定义两个Agent工具。
一个工具叫web_search。
另一个工具叫web_fetch。
底层是fastCRW。
fastCRW是一个Firecrawl兼容的网络数据引擎。
它是单个Rust二进制。
可以自托管。
也可以用云服务。
因为它的REST API和Firecrawl兼容。
这个模块直接复用Firecrawl的客户端。
只换base URL。
云服务默认指向fastcrw.com/api。
自托管时在工具配置里覆盖base_url。
或者设置环境变量CRW_API_URL。

## 二、模块里的主要成员

（1）web_search_tool
这是web_search工具。
参数只有query。
max_results默认5。
从配置里可覆盖。
调用FirecrawlApp的search方法。
结果里result.web是结果对象列表。
归一化成title、url、snippet结构。
返回JSON。

（2）web_fetch_tool
这是web_fetch工具。
参数只有url。
抓取之前做SSRF校验。
校验用共享的validate_public_http_url。
运营者可以通过allow_private_addresses配置放开内网目标。
调用FirecrawlApp的scrape方法。
formats指定markdown。
返回标题加markdown正文。
正文截断到4096字符。

（3）_get_fastcrw_client
这个函数构建客户端。
API key从两个地方取。
先取配置里的api_key。
取不到再取环境变量CRW_API_KEY。
base_url同样先配置后环境变量。
用FirecrawlApp作为客户端类。

（4）_coerce_bool
把配置值转成布尔。
接受true/false的字符串写法。

## 三、它和谁协作

这个模块依赖谁。
依赖firecrawl库的FirecrawlApp。
虽然是fastCRW引擎。
但API兼容。
所以用Firecrawl的Python客户端。
依赖deerflow.community.url_safety。
依赖deerflow.config。

谁调用这个模块。
DeerFlow的工具框架把它注册给Agent。
config.yaml的tools列表里配置了才启用。

## 四、重要性评级

评级：3分。
理由：这是一个"借壳"式的可选提供商。API兼容Firecrawl，所以几乎没写网络层代码。核心逻辑就是复用客户端加换地址。SSRF校验复用共享模块。代码量111行。功能面窄。使用面窄。给3分。
