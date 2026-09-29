# serper-web-search-tool-档案

## 一、这个类是干什么的

web_search_tool不是类。

它是community/serper/tools.py里的LangChain @tool函数。

serper/tools.py是通过Serper的Google搜索和图片搜索工具。

两个工具如下。

web_search用Google Search via Serper。

image_search用Google Images via Serper。

image_search在图片生成之前使用。找参考图。

API key从环境变量读。

这个模块位于backend/packages/harness/deerflow/community/serper/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、web_search_tool

web_search按query搜索。

max_results默认5。上限10。可从配置覆盖。

query规整。

没有API key时返回missing key错误。

POST带X-API-KEY头。

结果取organic字段。

搜索结果链接原样返回。

不经过_safe_public_url。

它们是给模型读的引用。

不是这个工具fetch或下载的。

和image_search的图片URL不同。

### 2、image_search_tool

image_search用Google Images。

结果取images字段。

imageUrl和thumbnailUrl经过_safe_public_url检查。

跨字段回退只在另一个字段缺席时发生。

存在但被SSRF过滤掉的字段留空。

不塌缩到对应字段。

被丢弃的高清URL永不静默冒充预览。

反之亦然。

保留调用方依赖的高清和预览契约。

### 3、尾部点处理

_safe_public_url剥单个尾部点。

FQDN根标签。

localhost.和127.0.0.1.在常见resolver上解析到回环。

否则会溜过localhost和IP检查。

### 4、_decode_ipv4

它解码ip_address拒绝的混淆IPv4字面量。

镜像HTTP客户端的宽容inet_aton解析。

整数、十六进制、八进制编码都被认出。

cafe.com这样的真域名解码失败。

留给调用方当host处理。

### 5、_serper_post

它发送POST到Serper端点。

返回(data, error_json)元组。

成功时data是解析的JSON。error_json为None。

失败时data为None。error_json是序列化的结构化错误。

HTTP超时30秒。

### 6、serply和tencent_wsa对照

serply模块类似。支持vertical参数。

tencent_wsa是腾讯网信安搜索。

支持mode参数和request_id。

sofya、unbrowse、infoquest都是类似结构。

## 三、它和谁协作

- Serper API是搜索后端。
- get_app_config提供工具配置。
- web_fetch工具配合搜索结果。
- view_image工具消费图片URL。

## 四、重要性评级

评级是4分。

理由如下。

这个模块是Serper搜索集成的实现。

SSRF守卫处理混淆IPv4和尾部点。

跨字段回退区分缺席和被过滤。

高清和预览契约保留。

搜索引用不经过SSRF检查的理由正确。

这些质量不错。

扣掉6分。

扣分原因是它是可选搜索集成。
