# deerflow.community.crawl4ai档案

本文档介绍deerflow.community.crawl4ai包。

本文档基于对`backend/packages/harness/deerflow/community/crawl4ai/`目录的实际代码阅读。

本文档的读者是想理解这个包的开发者。

## 一、这个包是干什么的

这个包是Crawl4AI的工具集成。

Crawl4AI是一个开源的爬虫框架。

Crawl4AI专门为AI代理设计。

Crawl4AI把网页抓下来并转成干净的markdown。

Crawl4AI可以自托管。

用户用Docker跑一个Crawl4AI服务器。

Crawl4AI服务器的默认端口是11235。

这个包让DeerFlow的AI代理能够通过自托管的Crawl4AI服务器抓取网页。

AI代理调用`web_fetch`工具。

工具把URL发给Crawl4AI服务器。

Crawl4AI服务器返回页面的markdown。

markdown回到AI代理手里。

这个包只做网页抓取。

这个包不做搜索。

这个包对应Sofya、Jina等工具里的fetch那一半。

区别是Crawl4AI由用户自己托管。

用户的URL不经过第三方云服务。

## 二、包里的主要成员

包只有3个Python文件。

### 1、crawl4ai_client.py里的Crawl4AiClient

`Crawl4AiClient`是异步HTTP客户端。

客户端基于httpx实现。

客户端的构造函数接受3个参数。

- `base_url`是Crawl4AI服务器地址。
- `token`是可选的认证令牌。
- `timeout_s`是超时秒数，默认30秒。

客户端只有一个方法。

方法是`fetch_markdown`。

方法向Crawl4AI的`POST /md`端点发请求。

请求体是`{"url": url, "f": filter_mode}`。

`filter_mode`是Crawl4AI的markdown过滤器。

过滤器有4种取值。

- `fit`是默认值，返回过滤后的相关内容。
- `raw`返回原始markdown。
- `bm25`用BM25算法过滤。
- `llm`用LLM过滤。

有token时请求带`Authorization: Bearer <token>`头。

没有token就省略认证头。

自托管的Crawl4AI常常不需要认证。

方法的错误处理把所有失败都转成`Error: ...`字符串。

- HTTP非200返回HTTP状态码和响应文本。
- 200但非JSON返回content-type和响应文本。
- 200但`success`为false返回失败提示。
- 200但markdown为空返回空内容提示。
- 超时返回超时提示。
- 网络错误返回请求失败提示。

这个设计让工具层不用写try/except。

工具层只需要检查返回值是不是以`Error:`开头。

### 2、tools.py里的web_fetch_tool

`web_fetch_tool`是暴露给AI代理的Agent工具。

工具注册名叫`web_fetch`。

工具是异步函数。

工具接受1个参数。

参数是`url`。

工具的工作流程是这样的。

第一步是读配置。

配置来自`config.yaml`的`web_fetch`工具条目。

配置只读一次。

配置值被传递下去。

这样避免在并发热重载时读到不一致的配置。

第二步是URL安全校验。

校验用`validate_public_http_url`。

默认只允许公网地址。

配置`allow_private_addresses`可以放开私网地址。

默认不放开的理由是防SSRF。

也就是防止代理被诱导访问内网服务。

第三步是解析过滤器配置。

`_coerce_filter`把配置值规范成合法的过滤器。

大小写会被统一。

拼写错误会打警告并回退到fit。

这样错误在配置读取时就被发现。

而不是让服务器返回一个不透明的HTTP 400。

第四步是构建客户端。

`_build_client`从配置构建`Crawl4AiClient`。

配置项有3个。

- `base_url`是服务器地址，默认`http://localhost:11235`。
- `token`是认证令牌，默认空。
- `timeout`是超时秒数，默认30。

第五步是调用客户端抓取。

第六步是截断返回。

markdown超过4096字符会被截断。

### 3、tools.py里的辅助函数

- `_coerce_timeout`把配置的超时规范成秒数。
- `_coerce_bool`把配置值规范成布尔。
- `_coerce_filter`规范并校验markdown过滤器。
- `_build_client`从配置构建客户端。

`_coerce_timeout`有个细节。

布尔值和非数字字符串会回退到默认值。

这样YAML里的`timeout: off`。

也就是`False`。

不会变成`0.0`。

`0.0`会让每个请求都立即超时。

这个坑被显式挡掉了。

这个实现镜像了`jina_ai`包的同名函数。

## 三、它和谁协作

这个包依赖这些外部事物。

- 依赖一台用户自己用Docker托管的Crawl4AI服务器（默认`http://localhost:11235`）。
- 依赖`deerflow.community.url_safety`的`validate_public_http_url`做SSRF防护。
- 依赖`deerflow.config`的`get_app_config`读取工具配置。
- 依赖httpx做HTTP请求。
- 依赖langchain的tool装饰器注册成Agent工具。

这个包被这些地方调用。

AI代理在对话中调用`web_fetch`工具。

工具在DeerFlow里是可插拔的网页抓取实现。

DeerFlow支持多个fetch后端。

Jina、Browserless、Sofya、Crawl4AI都是候选。

操作员在`config.yaml`的tools列表里选择启用哪个。

它们共享同一个工具名。

也就是`web_fetch`。

## 四、重要性评级

评级：4分。

理由是这样的。

这个包是一个网页抓取后端的适配器。

抓取是AI代理的高频能力。

Crawl4AI是自托管的。

数据不出用户的网络。

这对有隐私要求的用户有价值。

这个包有一些不错的工程细节。

URL安全校验防SSRF。

配置的容错解析挡住了timeout为0的坑。

过滤器校验提前发现配置错误。

但是这个包是可选依赖。

用户必须自己跑一个Crawl4AI服务器。

DeerFlow有很多fetch后端可选。

Jina和Sofya都是云服务开箱即用。

Crawl4AI的不可替代性集中在自托管场景。

这个包的代码量也小。

就是一个客户端加一个工具。

综合评级是4分。
