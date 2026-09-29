# brave-web-search-tool-档案

## 一、这个类是干什么的

web_search_tool不是类。

它是community/brave/tools.py里的LangChain @tool函数。

brave/tools.py是Brave Search的web搜索和图片搜索工具。

两个工具如下。

web_search搜web信息。

image_search在线搜图片。

image_search在图片生成之前使用。

给角色、肖像、物品、场景找参考图。

API key从环境变量读。

这个模块位于backend/packages/harness/deerflow/community/brave/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、web_search_tool

web_search按query搜索。

max_results默认5。可从工具配置覆盖。

count限制上限。

query规整。上限400字符。

没有API key时返回missing key错误。

参数是q、count、text_decorations为False。

time_range映射BRAVE_FRESHNESS_BY_TIME_RANGE。

day映射pd、week映射pw等。

HTTP超时30秒。

结果规整成title、url、content。

### 2、image_search_tool

image_search用Brave Image Search。

支持country、search_lang、safesearch、spellcheck额外参数。

结果里的URL经过_safe_public_url检查。

每个条目记下URL来自哪个字典。

报告的宽高描述实际返回的URL。

不是被丢弃的那个。

thumbnail和image可以互相回退。

都不安全时跳过条目。

全部不安全时返回error。

usage_hint提示先下载再用作参考图。

### 3、SSRF守卫

_safe_public_url是尽力SSRF守卫。

拒绝非http(s) scheme、localhost、私有或非全局IP字面量。

包括混淆的十进制、十六进制、八进制编码。

_decode_ipv4解码ip_address拒绝的混淆IPv4字面量。

镜像HTTP客户端的宽容inet_aton解析。

整数2130706433、十六进制0x7f000001、八进制0177.0.0.1都被认出。

_embedded_ipv4提取IPv6字面量里嵌的IPv4。

覆盖IPv4映射::ffff:a.b.c.d、6to4、NAT64、IPv4兼容形式。

这些都通过IPv6路径走私v4目的地。

只用v6字面量的is_global会把回环或私有目标报成安全。

### 4、注意

它只检查URL字符串。

抓不住解析到内部IP的公开hostname。

真正下载这些URL的消费者必须在fetch时重新验证解析出的IP。

那是url_safety.py的validate_public_http_url职责。

### 5、_brave_get

HTTP GET带X-Subscription-Token头。

非字典payload报意外格式。

HTTP状态错误和普通异常都转成JSON error。

## 三、它和谁协作

- get_app_config提供工具配置。
- SearchTimeRange来自community/search_time_range.py。
- web_fetch工具配合搜索结果。
- view_image工具消费图片URL。

## 四、重要性评级

评级是5分。

理由如下。

这个模块是Brave搜索集成的实现。

SSRF守卫处理混淆IPv4和IPv6嵌入IPv4。

这是真实攻击面。

很多HTTP客户端的inet_aton宽容解析被镜像。

结果规整完整。

图片URL经过安全检查。

扣掉5分。

扣分原因是它是可选搜索集成。
