# deerflow.community.brave档案

本文档介绍DeerFlow社区工具包`deerflow.community.brave`。

本文档基于对`backend/packages/harness/deerflow/community/brave/`目录下全部代码的实际阅读。

本文档的读者是想理解这个包代码的开发者。

包目录下有两个代码文件。

一个是`__init__.py`。

一个是`tools.py`。

## 一、这个包是干什么的

这是Brave搜索服务的工具集成。

Brave Search是一个独立的搜索引擎。

Brave Search提供官方的REST API。

这个包调用Brave Search API。

这个包给AI代理提供两个工具。

一个是`web_search_tool`。这个工具搜索网页。

一个是`image_search_tool`。这个工具搜索图片。

这个包和DuckDuckGo的brave后端不同。

DuckDuckGo的brave后端是靠DDGS聚合库抓取结果。

这个包是直接调用Brave官方API。

直接调用官方API能得到结构化结果。

直接调用官方API有认证配额。

直接调用官方API有官方的SLA保障。

这个包需要API密钥。API密钥要在https://brave.com/search/api/注册获取。

## 二、包里的主要成员

### 1、`__init__.py`

这个文件只有3行代码。

这个文件导出两个工具。

导出的工具是`image_search_tool`和`web_search_tool`。

### 2、`web_search_tool`

这是一个LangChain工具。装饰器是`@tool("web_search")`。

这个工具用Brave搜索网页。

这个工具有3个参数。

第一个参数是`query`。这个参数是搜索关键词。

第二个参数是`max_results`。这个参数是最大结果数。默认值是5。

第三个参数是`time_range`。这个参数是可选的时间范围。时间范围支持day、week、month、year。

这个工具的执行流程是这样的。

第一步读取配置。配置来自`get_app_config().get_tool_config("web_search")`。配置里的`max_results`可以覆盖默认值。

第二步规范化参数。`_coerce_max_results`把结果数限制在1到20之间。Brave的`count`参数上限是20。`_clean_query`去掉首尾空白。查询长度上限是400字符。

第三步获取API密钥。密钥优先来自配置。配置没有就用环境变量`BRAVE_SEARCH_API_KEY`。没有密钥就返回结构化错误。

第四步发起HTTP请求。请求发到`https://api.search.brave.com/res/v1/web/search`。请求头带上`X-Subscription-Token`。超时是30秒。如果传了`time_range`，就把它映射成Brave的`freshness`参数。映射关系存在`BRAVE_FRESHNESS_BY_TIME_RANGE`里。day映射成pd。week映射成pw。month映射成pm。year映射成py。

第五步规范化结果。Brave返回的每条结果有title、url、description。这个工具把description改名为content。最后输出JSON。

### 3、`image_search_tool`

这也是一个LangChain工具。

这个工具用Brave图片搜索找图片。

这个工具的使用场景是在生成图片之前找参考图。

参考图能提高图片生成的质量。

这个工具有2个参数。

一个是`query`。这个参数是搜索关键词。

一个是`max_results`。这个参数默认是5。上限是200。Brave图片搜索允许比网页搜索更大的批量。

这个工具还支持从配置透传4个可选参数。

这4个参数是country、search_lang、safesearch、spellcheck。

这个工具对返回的每个图片条目做URL安全过滤。过滤逻辑在`_safe_public_url`里。

过滤之后有回退逻辑。

如果原图URL安全，就用原图。否则看缩略图。缩略图的处理逻辑是对称的。

这个工具记录宽度高度时用的是实际返回的那个URL的尺寸。不是被丢弃的那个URL的尺寸。

最后输出包含title、image_url、thumbnail_url、source_url、source、width、height。还带一条usage_hint。usage_hint提示把image_url用作图片生成的参考图。

### 4、API密钥与配置辅助函数

`_get_api_key(tool_name)`负责拿密钥。

取值顺序是先配置后环境变量。

配置路径是`config.yaml`里对应工具的`api_key`。

环境变量是`BRAVE_SEARCH_API_KEY`。

`_coerce_max_results(value)`负责规范化结果数。

非法输入用默认值5。

结果数被夹在1和上限之间。

`_clean_query(query)`负责清洗查询。

查询被去掉首尾空白。查询被截断到400字符。

`_missing_key_error(query, tool_name)`负责生成缺密钥错误。

这个函数每个工具名只记一次日志警告。警告集合是`_api_key_warned`。

`_brave_get(endpoint, api_key, query, params)`负责发GET请求。

这个函数返回`(data, error_json)`元组。

成功时data是JSON字典。error_json是None。

失败时data是None。error_json是结构化错误JSON。

### 5、SSRF防护辅助函数

这组函数保护图片URL不被用于攻击内网。

这类攻击叫SSRF。SSRF是服务端请求伪造。

`_safe_public_url(value)`是入口。

这个函数只放行安全的公网http(s)URL。

这个函数拒绝非http(s)协议。

这个函数拒绝localhost和`.localhost`后缀。

这个函数拒绝私有IP和非全局IP。

`_decode_ipv4(host)`负责识别伪装的IPv4写法。

很多HTTP客户端接受`inet_aton`风格的宽松解析。

例如整数写法`2130706433`。例如十六进制写法`0x7f000001`。例如八进制写法`0177.0.0.1`。

这些写法都指向127.0.0.1。`ip_address`会拒绝这些写法。这个函数能识别它们。

`_embedded_ipv4(ip)`负责识别嵌在IPv6里的IPv4地址。

覆盖的形态有4种。

第一种是IPv4映射地址`::ffff:a.b.c.d`。

第二种是6to4地址`2002::/16`。

第三种是NAT64地址`64:ff9b::/96`。

第四种是IPv4兼容地址`::a.b.c.d`。

这些形态会把v4目标藏在v6路径里。

只检查v6字面量的`is_global`会漏掉这些形态。回环地址可能被误判为安全。

`_is_url_present(value)`负责区分字段是缺失还是被过滤。

字段缺失时可以跨字段回退。

字段被SSRF过滤掉时必须保持为空。被过滤的字段不能回退到另一个字段。

## 三、它和谁协作

### 1、依赖的外部服务

这个包依赖Brave Search官方API。

网页搜索端点是`https://api.search.brave.com/res/v1/web/search`。

图片搜索端点是`https://api.search.brave.com/res/v1/images/search`。

### 2、依赖的内部模块

这个包依赖`deerflow.community.search_time_range`。

这个模块定义了`SearchTimeRange`类型。

这个模块定义了`BRAVE_FRESHNESS_BY_TIME_RANGE`映射。

这个包依赖`deerflow.config.get_app_config`。

这个函数读取应用配置。

这个包依赖第三方库httpx和langchain。

### 3、被谁调用

这两个工具的名字都注册为LangChain工具。

`web_search_tool`注册名是`web_search`。

`image_search_tool`注册名是`image_search`。

DeerFlow的代理工具装配层按配置选择搜索提供方。

选中的提供方的工具会被加进代理工具集。

AI代理在运行时直接调用这些工具。

图片生成流程会先调用`image_search_tool`找参考图。

## 四、重要性评级

评级：5分。

理由如下。

这个包是社区贡献的可选搜索提供方。

DeerFlow有多个搜索后端。DDG、Tavily、SearXNG、Serper、Serply都能替代它。

所以这个包不是必需组件。

但是这个包有自己的价值。

这个包是少数提供官方API的搜索集成。

官方API比DDG抓取更稳定。

这个包的SSRF防护写得非常完整。

`_safe_public_url`、`_decode_ipv4`、`_embedded_ipv4`覆盖了伪装IP的各种形态。

这套防护逻辑是其他搜索包复用的参考实现。

图片搜索工具直接支撑图片生成质量。

综合来看。这个包是可替代但质量较高的可选组件。评级5分。
