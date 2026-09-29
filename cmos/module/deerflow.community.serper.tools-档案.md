# 模块档案：deerflow.community.serper.tools

## 一、这个模块是干什么的

这个模块定义两个Agent工具。
一个工具叫web_search。
一个工具叫image_search。
底层是Serper。
Serper提供实时的Google搜索和Google图片结果。
通过JSON API。
使用它需要API key。
在serper.dev注册。
这个模块直接POST到Serper的搜索和图片端点。
web_search返回Google搜索结果。
image_search返回Google图片结果。

## 二、模块里的主要成员

（1）web_search_tool
这是web_search工具。
参数有query和max_results。
max_results默认5。
上限10。
从配置里可覆盖。
每次请求的num参数上限10。
query清理到500字符。
API key从两个地方取。
先取配置里的api_key。
取不到再取环境变量SERPER_API_KEY。
没有key返回结构化错误JSON。
每个工具名只告警一次。
返回结果归一化成title、url、content结构。
搜索结果的链接原样返回。
不经过SSRF守卫。
因为它们是给模型读的引用。
这个工具不下载它们。
这一点和image_search的图片URL不同。

（2）image_search_tool
这是image_search工具。
参数有query和max_results。
返回结果有image_url和thumbnail_url。
每个URL都经过SSRF守卫过滤。
因为模型可能拿这些URL去下载或作为生成参考。
跨界回退有一个关键细节。
一个字段缺失时可以回退到另一个字段。
一个字段存在但被SSRF过滤掉时必须留空。
不能塌缩到它的对应字段。
这样被丢弃的高清URL不会悄悄冒充预览图。
反过来也是。

（3）SSRF守卫辅助函数
_safe_public_url做尽力而为的SSRF检查。
拒绝非http(s)协议。
拒绝localhost和.localhost后缀。
拒绝私有和非全局IP字面量。
主机名会去掉单个尾点。
FQDN根标签。
localhost.和127.0.0.1.在常见解析器上解析到回环。
不去点会绕过检查。
_decode_ipv4解码混淆的IPv4字面量。
镜像inet_aton的宽松解析。
十进制、十六进制、八进制写法都能识别。

## 三、它和谁协作

这个模块依赖谁。
依赖httpx发HTTP请求。
依赖langchain的tool装饰器。
依赖deerflow.config。

谁调用这个模块。
DeerFlow的工具框架把它注册给Agent。
config.yaml的tools列表里配置了才启用。

## 四、重要性评级

评级：4分。
理由：这是一个Google搜索API的可选提供商。它对SSRF的防护比一般薄封装细。混淆IPv4解码、尾点处理、图片URL的跨界回退规则都有。搜索链接和图片URL的守卫差异处理合理。但它是可选集成。需要API key。给4分。
