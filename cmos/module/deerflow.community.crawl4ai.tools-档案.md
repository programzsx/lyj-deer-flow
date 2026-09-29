# 模块档案：deerflow.community.crawl4ai.tools

## 一、这个模块是干什么的

这个模块定义一个Agent工具。
工具名是web_fetch。
它用Crawl4AI抓取网页。
Crawl4AI返回页面的干净markdown。
工具把markdown截断到4096字符后返回。
抓取之前做SSRF校验。
校验用共享的validate_public_http_url。
运营者可以通过allow_private_addresses配置放开内网目标。
Crawl4AI是自托管服务。
默认地址是http://localhost:11235。
用户需要自己部署Crawl4AI的Docker服务。

## 二、模块里的主要成员

（1）web_fetch_tool
这是唯一的Agent工具。
参数只有url。
docstring和其他web_fetch提供商保持一致。
只抓取精确URL。
不能访问登录内容。
URL必须带协议。
工具先读一次配置。
配置只读一次。
然后把值传下去。
这样一次调用只读一次get_app_config。
不会在并发热重载时读到两半配置。
然后构造客户端。
然后调用fetch_markdown。
返回结果以Error:开头就直接返回。
否则截断到4096字符。

（2）配置强转函数
_coerce_timeout把配置的超时值转成秒。
布尔值回退到默认。
这样配置写成off不会变成0.0。
0.0会让每个请求对健康服务器都超时。
非数字字符串也回退到默认。
_coerce_bool把配置值转成布尔。
接受true/false的字符串写法。
_coerce_filter校验markdown过滤器。
过滤器会做归一化和校验。
大小写不同会归一化。
拼写错误会回退到默认fit。
同时打警告。
这样配置错误在读取时被抓住。
而不是变成服务端一个难懂的HTTP 400。

## 三、它和谁协作

这个模块依赖谁。
依赖同目录的crawl4ai_client模块。
依赖deerflow.community.url_safety。
依赖deerflow.config。

谁调用这个模块。
DeerFlow的工具框架把它注册给Agent。
config.yaml的tools列表里配置web_fetch用这个提供商才启用。

## 四、重要性评级

评级：3分。
理由：这是一个单工具的可选提供商模块。只有117行。它的价值在配置强转的防御性上。超时、布尔、过滤器三类配置都有兜底。但功能面窄，依赖用户自托管Crawl4AI服务。使用面窄。给3分。
