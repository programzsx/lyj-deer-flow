# 模块档案：deerflow.community.groundroute.tools

## 一、这个模块是干什么的

这个模块定义两个Agent工具。
一个工具叫web_search。
另一个工具叫web_fetch。
底层是GroundRoute。
GroundRoute是一个元搜索层。
它一个API顶在六个搜索引擎前面。
这六个引擎是Serper、Brave、Exa、Tavily、Firecrawl、Perplexity。
它把每个查询路由到最便宜的、能过质量门槛的引擎。
重复查询走缓存。
所以高流量的研究任务在单个引擎宕机时也能继续。
花费不超过直接调用单个引擎。
定价是收益分享。
调用方留下缓存节省的一半左右。
这个模块是自包含的。
只用httpx。
不用GroundRoute SDK。
/v1/search的请求和响应映射参照GroundRoute的MCP服务器和经过验证的Langflow组件。

## 二、模块里的主要成员

（1）web_search_tool
这是web_search工具。
参数有query和max_results。
max_results可以省略。
省略时用配置值。
默认5。
上限50。
服务端把max_results钳制在1到50。
客户端也做同样的钳制。
调用方传入的max_results优先。
只有省略时才回退到配置。
API key从两个地方取。
先取对应工具配置里的api_key。
取不到再取环境变量GROUNDROUTE_API_KEY。
tool_name是配置块的名字。
这样搜索用一个引擎、抓取用另一个引擎时各自读对的key。
返回结果归一化成title、url、snippet、source_engine结构。
source_engine告诉调用方实际选了哪个引擎。

（2）web_fetch_tool
这是web_fetch工具。
参数只有url。
它通过GroundRoute的mode等于page模式读取单个URL。
返回页面的提取文本。
文本截断到4096字符。

（3）请求辅助函数
_post_search发送POST请求。
带Bearer授权头。
错误处理分两类。
HTTP状态错误返回结构化的错误JSON。
其他异常也返回错误JSON。
_missing_key_error在key缺失时返回错误。
每个工具只告警一次。

## 三、它和谁协作

这个模块依赖谁。
只依赖httpx和标准库。
不用GroundRoute SDK。

谁调用这个模块。
DeerFlow的工具框架把它注册给Agent。
config.yaml的tools列表里配置了才启用。
API key通过GROUNDROUTE_API_KEY环境变量或配置提供。

## 四、重要性评级

评级：4分。
理由：这是一个元搜索聚合服务提供商。它的价值是多引擎故障切换和成本优化。它自包含、不依赖SDK。调用方传入的参数优先于配置，这个细节设计合理。它比单纯的薄封装多一层服务价值。但它是可选集成，需要API key。给4分。
