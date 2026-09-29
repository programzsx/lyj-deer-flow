# deerflow.community.searxng档案

本文档介绍DeerFlow社区工具包`deerflow.community.searxng`。

本文档基于对`backend/packages/harness/deerflow/community/searxng/`目录下全部代码的实际阅读。

本文档的读者是想理解这个包代码的开发者。

包目录下有3个代码文件。

一个是`__init__.py`。

一个是`searxng_client.py`。

一个是`tools.py`。

## 一、这个包是干什么的

这是SearXNG元搜索引擎的工具集成。

SearXNG是开源的元搜索引擎。

元搜索引擎本身不维护索引。

元搜索引擎把查询转发给多个搜索引擎。然后聚合结果。

用户可以自己部署SearXNG实例。

这个包调用用户自己部署的SearXNG实例的JSON API。

这个包给AI代理提供一个工具。

这个工具是`web_search_tool`。这个工具搜索网页。

这个包不需要商业API密钥。

搜索请求发到用户自己的SearXNG实例。这是私有部署。不存在商业配额问题。

## 二、包里的主要成员

### 1、`__init__.py`

这个文件只有3行代码。

这个文件导出一个工具。

导出的工具是`web_search_tool`。

### 2、`SearxngClient`

这是SearXNG API的客户端类。定义在`searxng_client.py`里。

这个类只有一个构造参数`base_url`。

`base_url`是SearXNG实例的地址。默认是`http://localhost:8088`。

构造时会去掉末尾的斜杠。

### 3、`SearxngClient.search`

这是客户端的搜索方法。这个方法是异步方法。

这个方法有4个参数。

第一个参数是`query`。这个参数是搜索关键词。

第二个参数是`max_results`。这个参数是最大结果数。

第三个参数是`categories`。这个参数是搜索分类。

第四个参数是`time_range`。这个参数是可选的时间范围。

这个方法的核心逻辑是翻页收集结果。

SearXNG的搜索API没有`limit`参数。

SearXNG每次只返回一页结果。每页条数由实例的`results_per_page`决定。默认是10条。

SearXNG会忽略传给它的limit参数。

所以`max_results`超过一页时。必须靠翻页收集。

翻页通过`pageno`参数实现。

这个方法最多翻5页。页数上限是`_MAX_PAGES = 5`。

翻页有上限是为了防止异常大的`max_results`发起无限请求。

翻页循环有去重逻辑。

去重键是结果的url。url为空时用title。

重复结果会被跳过。

翻页循环还有提前停止逻辑。

一页没有返回任何新结果时停止翻页。

这种情况说明实例在重复返回结果。或者查询结果已经耗尽。

收齐`max_results`条就提前返回。

### 4、`SearxngClient._search_page`

这是客户端的单页搜索方法。这个方法也是异步方法。

这个方法向`{base_url}/search`发GET请求。

请求参数是q、format、language、pageno。

format固定是json。

language固定是auto。

如果有分类，分类被逗号拼接进categories参数。

如果传了`time_range`，就透传给SearXNG。

请求头带了User-Agent和Accept。

超时是30秒。用的是`httpx.AsyncClient`。

出错时记日志后重新抛出异常。

`limit`参数被刻意不发。原因如上。SearXNG不认这个参数。发了也无法区分响应是截断的还是完整的。

### 5、`web_search_tool`

这是LangChain工具。定义在`tools.py`里。装饰器是`@tool("web_search")`。

这个工具用SearXNG搜索网页。

这个工具是异步工具。这一点和Brave、DDG的工具不同。Brave和DDG的工具是同步的。

这个工具有2个参数。

一个是`query`。这个参数是搜索关键词。

一个是`time_range`。这个参数是可选的时间范围。时间范围支持day、week、month、year。

时间范围在这个包里是原样透传的。SearXNG本身就接受day、week、month、year这些值。不需要映射。

这个工具先读取配置。

配置里能设置max_results和base_url。

`_get_searxng_client()`负责创建客户端。base_url从配置的`web_search`工具配置里取。默认是`http://localhost:8088`。

然后调用`client.search`执行搜索。

结果被规范化成title、url、snippet三个字段。最后输出JSON。

出错时返回结构化错误JSON。错误包含error和query。

### 6、`_get_tool_config`

这是配置辅助函数。

这个函数安全地读取工具配置的model_extra。

没配置时返回None。

## 三、它和谁协作

### 1、依赖的外部服务

这个包依赖一个SearXNG实例。

SearXNG实例是用户自己部署的开源元搜索引擎。

默认地址是`http://localhost:8088`。

DeerFlow的开发环境通常用Docker跑一个SearXNG容器。

### 2、依赖的内部模块

这个包依赖`deerflow.community.search_time_range`。

这个包依赖`deerflow.config.get_app_config`。

这个包依赖第三方库httpx和langchain。

### 3、被谁调用

这个工具注册名是`web_search`。

DeerFlow的代理工具装配层按配置选择搜索提供方。

配置选择searxng时这个工具会被加进代理工具集。

AI代理在运行时直接调用这个工具。

注意这个工具是异步的。调用方需要用await。

## 四、重要性评级

评级：4分。

理由如下。

这个包是社区贡献的可选搜索提供方。

DeerFlow有多个搜索后端可以互相替代。

所以这个包不是必需组件。

但是这个包有独特的价值。

这个包面向私有部署。不需要商业API密钥。不产生费用。

私有部署适合在意数据隐私的场景。查询不会发给商业搜索公司。

这个包的翻页收集逻辑处理了SearXNG API的一个真实怪癖。SearXNG没有limit参数。翻页上限和重复停止逻辑都写得比较周到。

综合来看。这个包是可替代但有隐私优势的可选组件。评级4分。
