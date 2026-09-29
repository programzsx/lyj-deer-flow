# 模块档案：deerflow.community.brave.tools

## 一、这个模块是干什么的

这个模块提供Brave搜索驱动的网络搜索和图片搜索工具。
Brave Search是一个独立搜索索引。
它通过REST API提供服务。
使用它需要API key。
这个模块和DuckDuckGo聚合器里的brave后端不一样。
DuckDuckGo的brave后端是通过DDGS聚合去抓结果。
这个模块直接调用官方的Brave Search API。
直接调用带来三个好处。
第一个好处是结构化结果。
第二个好处是经过认证的配额。
第三个好处是有文档保证的服务等级。
这个模块暴露两个Agent工具。
一个是web_search。
一个是image_search。
image_search的典型用法是在图片生成之前先搜参考图。

## 二、模块里的主要成员

（1）web_search_tool
这是web_search工具。
参数有query、max_results、time_range。
max_results默认5。
Brave的count参数每次请求最多20。
time_range是可选的相对时间窗口。
取值是day、week、month、year。
翻译用search_time_range模块的BRAVE_FRESHNESS_BY_TIME_RANGE对照表。
翻译结果是pd、pw、pm、py。
API key从两个地方取。
先取config.yaml里的api_key。
取不到再取环境变量BRAVE_SEARCH_API_KEY。
没有key时返回结构化的错误JSON。
同时每个工具名只告警一次。

（2）image_search_tool
这是image_search工具。
Brave图片搜索支持比网页搜索更大的批次。
网页搜索最多20。
图片搜索最多200。
返回结果里有image_url、thumbnail_url、source_url。
每个URL都经过SSRF守卫过滤。
宽度高度字段跟实际返回的URL对应。
不会把被丢弃URL的尺寸报给另一个URL。

（3）SSRF守卫辅助函数
_safe_public_url做尽力而为的SSRF检查。
它拒绝非http(s)协议。
拒绝localhost。
拒绝私有和非全局的IP字面量。
_decode_ipv4解码混淆的IPv4字面量。
很多HTTP客户端用inet_aton的宽松解析。
所以十进制、十六进制、八进制的回环地址写法都能被识别出来。
例如2130706433。
例如0x7f000001。
例如0177.0.0.1。
_embedded_ipv4提取IPv6字面量里内嵌的IPv4。
覆盖四种形式。
IPv4映射形式。
6to4形式。
NAT64形式。
IPv4兼容形式。
这些形式会把IPv4目标藏在IPv6路径里。
只看IPv6字面量的is_global会误判安全。

## 三、它和谁协作

这个模块依赖谁。
依赖httpx发HTTP请求。
依赖langchain的tool装饰器。
依赖deerflow.community.search_time_range的时间范围契约。
依赖deerflow.config的get_app_config。

谁调用这个模块。
DeerFlow的工具注册框架把它注册成Agent的web_search和image_search工具。
config.yaml的tools列表里配置了它才会启用。
返回结果是JSON字符串。
结构是query加total_results加results列表。
每个结果有title、url、content。
这个结构和其他搜索提供商保持一致。

## 四、重要性评级

评级：4分。
理由：这是一个可选的社区搜索提供商。需要用户自己注册Brave API key。它本身是标准的REST API封装。写法上有两个亮点。一个是对混淆IP和IPv6内嵌IPv4的SSRF防护。另一个是图片搜索里URL与尺寸的对应关系处理。但它在整个系统里只是多个搜索选项之一。默认配置不启用它。所以给4分。
