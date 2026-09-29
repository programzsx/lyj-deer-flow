# deerflow.community.groundroute档案

本文档介绍deerflow.community.groundroute包。

本文档基于对`backend/packages/harness/deerflow/community/groundroute/`目录的实际代码阅读。

本文档的读者是想理解这个包的开发者。

## 一、这个包是干什么的

这个包是GroundRoute的工具集成。

GroundRoute是一个元搜索层。

GroundRoute的官网是https://groundroute.ai。

GroundRoute在6个搜索引擎前面放了一个API。

6个引擎是Serper、Brave、Exa、Tavily、Firecrawl、Perplexity。

GroundRoute的运行方式是这样的。

每次查询会被路由给一个引擎。

GroundRoute选择能通过质量线的最便宜的引擎。

重复查询会被缓存。

一个引擎挂了。

GroundRoute会切换到别的引擎。

这样高频的研究任务不会因为单个引擎故障而中断。

成本也不高于直连单个引擎。

计费是收益分成模式。

调用者保留缓存节省额的大约一半。

这个包让DeerFlow的AI代理能够用GroundRoute搜索网页和抓取页面。

这个包提供两个Agent工具。

一个是`web_search`。

一个是`web_fetch`。

这个模块是自包含的。

模块只用httpx。

模块不用GroundRoute的SDK。

请求和响应映射镜像了GroundRoute的MCP服务器和Langflow组件。

## 二、包里的主要成员

包只有2个Python文件。

`__init__.py`导出`web_fetch_tool`和`web_search_tool`。

`tools.py`装下全部逻辑。

### 1、web_search_tool

`web_search_tool`是web搜索工具。

工具注册名叫`web_search`。

工具是同步函数。

工具接受2个参数。

- `query`是搜索关键词。
- `max_results`是最大结果数，默认5，限制在1到50。

工具的工作流程是这样的。

第一步是解析结果数。

调用者传入的`max_results`优先。

调用者没传时才读配置。

配置来自`config.yaml`的`web_search`工具条目。

GroundRoute服务端会把max_results限制到1到50。

客户端也做同样的限制。

客户端和服务端保持一致。

第二步是获取API密钥。

密钥有两个来源。

先看`config.yaml`里工具条目的`api_key`。

再看`GROUNDROUTE_API_KEY`环境变量。

没有密钥时返回JSON错误。

错误是`GROUNDROUTE_API_KEY is not configured`。

错误里带query上下文。

每个工具只警告一次密钥缺失。

警告会提示去https://groundroute.ai/keys拿免费密钥。

第三步是发请求。

请求打到`https://api.groundroute.ai/v1/search`。

请求体是`{"query": query, "max_results": count}`。

认证用`Authorization: Bearer <key>`头。

超时30秒。

第四步是规范化结果。

每条结果被规范化成4个字段。

- `title`是标题。
- `url`是链接。
- `snippet`是摘要。
- `source_engine`是返回这条结果的引擎名。

`source_engine`是这个包的特色字段。

模型能看到结果来自哪个引擎。

没有结果时返回JSON错误。

HTTP错误返回`GroundRoute API error: HTTP <状态码>`。

### 2、web_fetch_tool

`web_fetch_tool`是网页抓取工具。

工具注册名叫`web_fetch`。

工具接受1个参数。

参数是`url`。

工具有个特殊的设计。

GroundRoute没有独立的fetch端点。

fetch复用了同一个search端点。

请求体是`{"query": url, "mode": "page", "max_results": 1}`。

`mode: page`告诉GroundRoute只读页面内容。

这个设计镜像了GroundRoute的MCP服务器。

工具的工作流程是这样的。

第一步是获取API密钥。

密钥来自`web_fetch`工具条目或环境变量。

第二步是发请求。

第三步是提取内容。

第一条结果的`content`优先。

`content`没有就用`snippet`。

内容按4096字符截断。

截断常量是`_FETCH_SNIPPET_LIMIT`。

最后返回`# 标题\n\n内容`的格式。

### 3、辅助函数

tools.py里还有几个辅助函数。

- `_get_api_key`解析API密钥，接受工具名参数。
- `_coerce_max_results`把输入规范成1到50的有界整数。
- `_missing_key_error`构造密钥缺失的JSON错误。
- `_post_search`发送search端点的POST请求。

`_get_api_key`接受工具名参数。

工具名是配置段的名字。

也就是web_search或web_fetch。

这样做的理由是这样的。

一个流程可能用GroundRoute做fetch。

同时用另一个引擎做search。

两个配置段各自有自己的密钥。

按工具名读取才能读对密钥。

这个设计镜像了serper、exa、firecrawl包。

## 三、它和谁协作

这个包依赖这些外部事物。

- 依赖GroundRoute的托管API（`https://api.groundroute.ai/v1/search`）。
- 依赖`deerflow.config`的`get_app_config`读取工具配置。
- 依赖httpx做HTTP请求。
- 依赖langchain的tool装饰器注册成Agent工具。

这个包被这些地方调用。

AI代理在对话中调用`web_search`和`web_fetch`工具。

工具在DeerFlow里是可插拔的搜索实现。

DeerFlow支持多个搜索后端。

SearXNG、Brave、Tavily、DDG、Serper、Sofya、GroundRoute都是候选。

操作员在`config.yaml`的tools列表里选择启用哪个。

GroundRoute和它们共享同一个工具名。

也就是`web_search`和`web_fetch`。

GroundRoute的上游是6个搜索引擎。

GroundRoute自己负责路由和缓存。

这个包不需要关心引擎选择。

## 四、重要性评级

评级：3分。

理由是这样的。

这个包是一个搜索后端的适配器。

而且是多个搜索后端中最外围的一个。

GroundRoute本身又是一层代理。

GroundRoute后面才是真正的搜索引擎。

这个包只对接GroundRoute一个API端点。

这个包的代码非常小。

一个文件装下全部逻辑。

没有复杂的状态管理。

没有复杂的错误恢复。

这个包是可选依赖。

用户必须注册GroundRoute账号。

用户必须配置API密钥。

DeerFlow有很多搜索后端可选。

直接对接Serper、Brave、Tavily的包都存在。

GroundRoute的价值集中在成本优化和多引擎容错。

这个价值属于特定的高频研究场景。

普通用户的不可替代性低。

综合评级是3分。
