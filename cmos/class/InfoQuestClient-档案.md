# InfoQuestClient-档案

## 一、这个类是干什么的

InfoQuestClient是community/infoquest/infoquest_client.py里的类。

它是InfoQuest web搜索和fetch API的客户端。

InfoQuest是BytePlus的搜索和抓取服务。

它提供web_search、web_fetch、image_search能力。

INFOQUEST_API_KEY环境变量保存API key。

这个类位于backend/packages/harness/deerflow/community/infoquest/infoquest_client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、InfoQuestClient本身

构造参数包括fetch_time、fetch_timeout、fetch_navigation_timeout。

search_time_range、image_search_time_range、image_size。

-1表示默认无限制。

api_key_set记录key是否配置。

请求超时30秒。bounds本地connect和read不活动。

fetch_timeout配置远程抓取。

### 2、fetch方法

它抓取URL。

POST打reader.infoquest.bytepluses.com。

follow_redirects为True。

非200返回错误。

空响应返回错误。

JSON响应提取reader_result字段。

没有时回退到content字段。

都没有时返回原始响应。

非JSON时返回原始文本。

异常转成Error字符串。

### 3、搜索方法

search方法打InfoQuest搜索API。

image_search搜图。

支持time range和image size。

### 4、debug日志

构造和fetch都有详细debug日志。

配置详情、请求参数、响应样本。

API key只记录是否配置。不记录值。

### 5、infoquest/tools.py对照

tools.py提供web_search_tool、web_fetch_tool、image_search_tool。

_coerce_seconds规整时间配置。

SSRF检查在fetch路径。

## 三、它和谁协作

- InfoQuest API是外部搜索和抓取端。
- infoquest/tools.py的工具调用它。
- validate_public_http_url做SSRF检查。

## 四、重要性评级

评级是3分。

理由如下。

这个类是InfoQuest集成的客户端。

fetch回退链完整。reader_result、content、原始文本。

debug日志不泄露key值。

超时分开配置本地和远程。

扣掉7分。

扣分原因是它是薄HTTP客户端。

日志冗长。
