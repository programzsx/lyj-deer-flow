# deerflow.community.sofya档案

本文档介绍deerflow.community.sofya包。

本文档基于对`backend/packages/harness/deerflow/community/sofya/`目录的实际代码阅读。

本文档的读者是想理解这个包的开发者。

## 一、这个包是干什么的

这个包是Sofya的工具集成。

Sofya是一个面向AI代理的托管web API。

Sofya的官网是https://sofya.co。

Sofya提供两个能力。

一个是web搜索。

Sofya的搜索直接返回结果页面的内容。

不只是搜索摘要。

这和普通搜索引擎不同。

普通搜索只给摘要。

代理还要再去抓取页面。

Sofya一步到位。

另一个是网页抓取。

Sofya的fetch返回单个页面。

返回的内容是干净的markdown。

使用Sofya需要API密钥。

用户要去https://sofya.co注册获取。

这个包让DeerFlow的AI代理能够用Sofya搜索网页和抓取页面。

这个包提供两个Agent工具。

一个是`web_search`。

一个是`web_fetch`。

## 二、包里的主要成员

包只有2个Python文件。

`__init__.py`导出`web_fetch_tool`和`web_search_tool`。

`tools.py`装下全部逻辑。

### 1、web_search_tool

`web_search_tool`是web搜索工具。

工具注册名叫`web_search`。

工具是同步函数。

工具接受3个参数。

- `query`是搜索关键词。
- `max_results`是最大结果数，默认5，上限20。
- `time_range`是可选的时间范围，取值是day、week、month、year。

工具的工作流程是这样的。

第一步是读配置。

配置来自`config.yaml`的`web_search`工具条目。

调用者传入的`max_results`优先。

调用者没传时才用配置值。

第二步是解析搜索深度。

搜索深度有两种取值。

- `basic`是默认值。
- `snippets`只返回摘要。

不支持的取值会被忽略。

忽略时会打警告日志。

第三步是解析内容限制。

`contents_max_characters`限制单条结果的内容长度。

默认2000字符。

0表示不限制。

限制的作用是让普通搜索保持内联。

搜索结果不会因为太大而被写到磁盘。

第四步是获取API密钥。

密钥有两个来源。

先看`config.yaml`里工具条目的`api_key`。

再看`SOFYA_API_KEY`环境变量。

没有密钥时返回错误。

每个工具只警告一次密钥缺失。

第五步是发请求。

请求打到`https://sofya.co/v1/search`。

请求用httpx的同步Client。

超时60秒。

认证用`Authorization: Bearer <key>`头。

`time_range`会作为`freshness`字段传给Sofya。

Sofya的freshness语义和 DeerFlow 的SearchTimeRange一致。

第六步是规范化结果。

每条结果被规范化成3个字段。

- `title`是标题。
- `url`是链接。
- `content`是页面内容或摘要。

结果里有内容就用内容。

结果里没内容就用摘要`description`。

内容按限制截断。

最后输出JSON。

JSON带`query`、`total_results`和`results`。

### 2、web_fetch_tool

`web_fetch_tool`是网页抓取工具。

工具注册名叫`web_fetch`。

工具接受1个参数。

参数是`url`。

工具的工作流程是这样的。

第一步是获取API密钥。

密钥来自`web_fetch`工具条目或环境变量。

第二步是发请求。

请求打到`https://sofya.co/v1/fetch`。

请求体是`{"urls": [url]}`。

第三步是检查结果。

第一条结果的`success`为false时返回错误。

第四步是提取内容。

内容按4096字符截断。

截断常量是`_SOFYA_FETCH_MAX_CHARS`。

最后返回`# 标题\n\n内容`的markdown格式。

### 3、辅助函数

tools.py里还有几个辅助函数。

- `_get_api_key`解析API密钥，先配置后环境变量。
- `_coerce_max_results`把输入规范成有界的正整数。
- `_coerce_content_limit`规范内容限制，0表示不限制。
- `_resolve_search_depth`解析搜索深度，无效值回退默认值。
- `_sofya_post`发送POST请求，返回`(data, error)`二元组。
- `_clip`把字段转成文本并截断。
- `_response_results`提取响应里的results列表，畸形时返回None。

`_sofya_post`的错误处理是这样的。

HTTP状态错误返回`Sofya API error: HTTP <状态码>`。

其他异常返回异常文本。

错误文本截断到500字符。

日志里会记录响应文本的前500字符。

## 三、它和谁协作

这个包依赖这些外部事物。

- 依赖Sofya的托管API（`https://sofya.co/v1`）。
- 依赖`deerflow.config`的`get_app_config`读取工具配置。
- 依赖`deerflow.community.search_time_range`的SearchTimeRange类型。
- 依赖httpx做HTTP请求。
- 依赖langchain的tool装饰器注册成Agent工具。

这个包被这些地方调用。

AI代理在对话中调用`web_search`和`web_fetch`工具。

工具在DeerFlow里是可插拔的搜索实现。

DeerFlow支持多个搜索后端。

SearXNG、Brave、Tavily、DDG、Serper、Sofya都是候选。

操作员在`config.yaml`的tools列表里选择启用哪个。

Sofya和它们共享同一个工具名。

也就是`web_search`和`web_fetch`。

## 四、重要性评级

评级：4分。

理由是这样的。

这个包是一个搜索后端的适配器。

搜索是AI代理的高频能力。

Sofya的搜索直接返回页面内容。

这个特性对代理有用。

代理省去了二次抓取。

但是这个包是可选依赖。

用户必须注册Sofya账号。

用户必须付费获取API密钥。

不配置这个包，DeerFlow可以换用其他搜索后端。

DeerFlow有很多搜索后端可选。

所以Sofya的不可替代性低。

这个包的代码也不复杂。

没有复杂的状态管理。

没有复杂的错误恢复。

就是简单的HTTP适配。

综合评级是4分。
