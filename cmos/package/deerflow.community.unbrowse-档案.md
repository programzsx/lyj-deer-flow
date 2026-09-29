# deerflow.community.unbrowse档案

本文档解读`deerflow.community.unbrowse`这个包。

本文档基于对包内两个代码文件的实际阅读。

这两个文件是`__init__.py`、`tools.py`。

本文档的读者是想理解这套代码的开发者。

## 一、这个包是干什么的

这个包是Unbrowse网页抓取服务的工具集成。

Unbrowse是一个托管服务。

这个服务的定位是把网站变成面向代理的API。

这个包只暴露一个工具。

工具名是`web_fetch`。

工具的作用是抓取一个URL的网页内容。

内容以markdown形式返回。

Unbrowse内部有两种渲染方式。

第一种是普通HTTP抓取，够用时用它。

第二种是云浏览器渲染，页面需要JS时用它。

用哪种由`render`参数决定。

这个包调用Unbrowse的MCP端点。

调用方式是一次JSON-RPC的`tools/call`POST请求。

这个包是全部社区包里最小的一个。

只有一个工具函数加几个辅助函数。

这个包是可选的社区贡献。

使用需要API key。

## 二、包里的主要成员

### 1、`web_fetch_tool`

`web_fetch_tool`定义在`tools.py`里。

这是一个LangChain工具。

工具名是`web_fetch`。

这个工具是同步函数，不是async。

工具流程是五步。

第一步取API key。

key优先从工具配置的`api_key`读。

配置没有就回退到`UNBROWSE_API_KEY`环境变量。

都没有就报错。

报错信息是`UNBROWSE_API_KEY is not configured`。

缺失key的警告只打一次。

`_api_key_warned`集合记录已警告过的工具名。

避免每次调用都刷日志。

第二步解析render配置。

render支持三种模式。

`auto`是默认，自动决定用不用云浏览器。

`never`是永远用普通HTTP。

`always`是永远用云浏览器。

不支持的值打警告后回退到`auto`。

第三步构造JSON-RPC请求。

请求发到`https://unbrowse.ai/api/mcp`。

请求体是标准的JSON-RPC 2.0格式。

method是`tools/call`。

params里带工具名`unbrowse.scrape`和参数。

参数包括url、formats为`["markdown"]`、render模式。

认证用Bearer token放在Authorization头里。

第四步发送请求并解析响应。

调用封装在`_call_unbrowse_tool`函数里。

超时是90秒。

这个函数返回`(data, error)`二元组。

成功时data是工具的JSON载荷，error是None。

失败时data是None，error是给模型看的错误消息。

错误处理覆盖五种情况。

第一种是HTTP状态错误。

第二种是网络请求失败。

第三种是响应体不是dict。

第四种是JSON-RPC的error字段存在。

第五种是工具级错误，即`result.isError`为真。

每种都有各自的日志和错误消息。

第五步提取内容返回。

成功载荷里取`markdown`字段。

内容截断到4096字符。

取`metadata.title`做标题。

返回格式是`# 标题`加空行加正文。

内容为空时返回`Error: No content found`。

### 2、辅助函数

`_get_api_key`读取API key。

读取顺序是先配置后环境变量。

`_resolve_render`解析render模式。

不支持的值回退默认并打警告。

`_call_unbrowse_tool`执行JSON-RPC调用。

这个函数是包里最长的函数。

这个函数负责请求、响应解析、全部错误分支。

`_tool_result_text`拼接MCP结果里的文本块。

MCP的result结构里content是一个块列表。

这个函数取每个块的text字段用换行拼接。

`_clip`把字段转成文本并截断。

limit为0表示不截断。

`_missing_key_message`生成key缺失的提示。

首次缺失会打一次警告日志。

`_UNBROWSE_MCP_URL`是服务端点常量。

`_UNBROWSE_TIMEOUT`是90秒超时常量。

`_UNBROWSE_FETCH_MAX_CHARS`是4096字符截断常量。

## 三、它和谁协作

### 1、依赖的上游

这个包依赖Unbrowse的托管服务。

服务端点是`https://unbrowse.ai/api/mcp`。

认证需要API key。

key在unbrowse.ai/app获取。

这个包依赖httpx发HTTP请求。

用的是同步的`httpx.Client`，不是异步的。

这个包依赖DeerFlow的核心模块。

依赖`deerflow.config`读工具配置。

依赖LangChain的`tool`装饰器。

这个包没有用`url_safety`做SSRF校验。

URL安全交给Unbrowse服务端处理。

### 2、服务的下游

这个包被DeerFlow的lead agent调用。

启用方式是在`config.yaml`里配置`web_fetch`工具并设置api_key。

工具名`web_fetch`和Tavily、Browserless、Crawl4AI、Jina等provider的同名。

DeerFlow按配置选择用哪个provider的实现。

多个provider里只有被选中的那个生效。

在`backend/packages/harness/deerflow/tools/AGENTS.md`的社区工具清单里，这个包被描述为"4KB限制、单次JSON-RPC调用、render可选auto/never/always"。

## 四、重要性评级

评级：3分。

理由如下。

这个包的功能单一。

只有一个web_fetch工具。

代码总量约175行。

是全部社区包里最小的之一。

逻辑简单。

一次HTTP调用加一层响应解析。

没有会话管理，没有状态。

功能上有大量替代品。

Tavily、Browserless、Crawl4AI、Jina、Firecrawl都提供web_fetch。

Unbrowse的差异化只有render模式选择和托管服务免部署。

这个包还依赖外部API key。

不注册Unbrowse账号就没法用。

这个包的价值在于给用户提供多一个抓取渠道选择。

作为可选社区贡献，它的存在是合理的。

但它对整个系统的重要性很低。

所以评级定为3分：小而完整的独立工具集成，可替代性强。
