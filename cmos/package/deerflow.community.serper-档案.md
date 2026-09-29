# deerflow.community.serper档案

本文档介绍DeerFlow社区工具包`deerflow.community.serper`。

本文档基于对`backend/packages/harness/deerflow/community/serper/`目录下全部代码的实际阅读。

本文档的读者是想理解这个包代码的开发者。

包目录下有两个代码文件。

一个是`__init__.py`。

一个是`tools.py`。

## 一、这个包是干什么的

这是Serper搜索服务的工具集成。

Serper是一个提供Google搜索结果的商业API服务。

Serper通过JSON API提供实时的Google搜索和Google图片结果。

这个包需要API密钥。API密钥要在https://serper.dev注册获取。

这个包给AI代理提供两个工具。

一个是`web_search_tool`。这个工具搜索Google网页结果。

一个是`image_search_tool`。这个工具搜索Google图片结果。

用户想用Google搜索质量时。这个包是DeerFlow里的选项之一。

## 二、包里的主要成员

### 1、`__init__.py`

这个文件只有3行代码。

这个文件导出两个工具。

导出的工具是`image_search_tool`和`web_search_tool`。

### 2、`web_search_tool`

这是一个LangChain工具。装饰器是`@tool("web_search")`。

这个工具用Serper搜Google网页结果。

这个工具有2个参数。

一个是`query`。这个参数是搜索关键词。

一个是`max_results`。这个参数默认是5。上限是10。

这个工具的执行流程是这样的。

第一步读取配置。配置里的`max_results`可以覆盖默认值。

第二步规范化参数。`_coerce_max_results`把结果数限制在1到10之间。`_clean_query`去掉首尾空白。查询长度上限是500字符。

第三步获取API密钥。密钥优先来自配置。配置没有就用环境变量`SERPER_API_KEY`。没有密钥就返回结构化错误。

第四步发POST请求。请求发到`https://google.serper.dev/search`。请求头带上`X-API-KEY`。请求体是q和num。

第五步读取organic字段。organic字段是自然搜索结果。字段缺失或为null视为无结果。有些API用`{"organic": null}`表示无结果。这不是格式错误。

第六步规范化结果。每条结果有title、link、snippet。这个工具把link改名为url。snippet改名为content。最后输出JSON。

搜索结果的链接是原样返回的。

链接不经过`_safe_public_url`过滤。

原因是这些链接是给模型读的引用。这个工具不会去下载这些链接。这一点和图片URL不同。

### 3、`image_search_tool`

这也是一个LangChain工具。

这个工具用Serper搜Google图片结果。

这个工具的使用场景是在生成图片之前找参考图。

这个工具有2个参数。

一个是`query`。这个参数是搜索关键词。

一个是`max_results`。这个参数默认是5。上限是10。

这个工具对每个图片条目做URL安全过滤。过滤逻辑在`_safe_public_url`里。

过滤之后有回退逻辑。

回退只发生在字段缺失的时候。

字段被SSRF过滤掉时不回退。被过滤的字段保持为空。

这条规则保护了高清图和预览图的对应关系。

一张被丢弃的高清URL不能悄悄冒充预览图。反过来也一样。

最后输出包含title、image_url、thumbnail_url。还带usage_hint。usage_hint提示把image_url用作图片生成的参考图。

### 4、API密钥与请求辅助函数

`_get_api_key(tool_name)`负责拿密钥。

取值顺序是先配置后环境变量。

配置路径是`config.yaml`里对应工具的`api_key`。

环境变量是`SERPER_API_KEY`。

`_coerce_max_results(value)`负责规范化结果数。

非法输入和非正数用默认值5。

结果被夹在1和10之间。

`_clean_query(query)`负责清洗查询。查询被截断到500字符。

`_missing_key_error(query, tool_name)`负责生成缺密钥错误。每个工具名只记一次警告。

`_serper_post(endpoint, api_key, query, max_results)`负责发POST请求。

这个函数返回`(data, error_json)`元组。成功时data是JSON字典。失败时error_json是结构化错误。

HTTP错误日志会截断响应文本到500字符。避免日志过大。

`_response_items(data, field, query)`负责安全读取结果字段。

字段缺失或null返回空列表。

字段类型不对返回格式错误。

字段里混入非字典项会被过滤掉。

### 5、SSRF防护辅助函数

这组函数保护图片URL不被用于攻击内网。

`_safe_public_url(value)`是入口。

这个函数只放行安全的公网http(s)URL。

这个函数拒绝非http(s)协议。

这个函数拒绝localhost和`.localhost`后缀。

这个函数会去掉主机名末尾的单个点。

`localhost.`和`127.0.0.1.`在常见解析器下都指向回环地址。不去掉末尾点会漏过检查。

这个函数拒绝私有IP和非全局IP。

`_decode_ipv4(host)`负责识别伪装的IPv4写法。

覆盖整数写法`2130706433`。十六进制写法`0x7f000001`。八进制写法`0177.0.0.1`。

`_is_url_present(value)`负责区分字段缺失和字段被过滤。缺失的字段才能回退。

## 三、它和谁协作

### 1、依赖的外部服务

这个包依赖Serper商业API。

网页搜索端点是`https://google.serper.dev/search`。

图片搜索端点是`https://google.serper.dev/images`。

### 2、依赖的内部模块

这个包依赖`deerflow.config.get_app_config`。

这个包依赖第三方库httpx和langchain。

注意这个包没有引用`search_time_range`。这个包不支持time_range参数。

### 3、被谁调用

这两个工具注册名分别是`web_search`和`image_search`。

DeerFlow的代理工具装配层按配置选择搜索提供方。

配置选择serper时这两个工具会被加进代理工具集。

AI代理在运行时直接调用这些工具。

## 四、重要性评级

评级：4分。

理由如下。

这个包是社区贡献的可选搜索提供方。

DeerFlow有多个搜索后端可以互相替代。

所以这个包不是必需组件。

但是这个包有独特的价值。

这个包提供Google搜索质量。Google的结果质量在很多查询上更好。

这个包的SSRF防护和Brave包一样完整。覆盖了伪装IP的写法和IPv6内嵌IPv4的情况。

这个包的细节处理比较周到。null字段与格式错误的区分。末尾点的剥离。被过滤字段不回退。这些细节都体现了几处真实踩坑经验。

这个包不支持时间范围参数。功能上比Brave和DDG少一块。

综合来看。这个包是可替代但质量较高的可选组件。评级4分。
