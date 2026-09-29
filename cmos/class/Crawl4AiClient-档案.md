# Crawl4AiClient-档案

## 一、这个类是干什么的

Crawl4AiClient是community/crawl4ai/crawl4ai_client.py里的类。

它是自托管Crawl4AI Docker服务器的客户端。

POST /md端点。

Crawl4AI是网页抓取转markdown服务。

它抓取页面的干净markdown。

这个类位于backend/packages/harness/deerflow/community/crawl4ai/crawl4ai_client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、Crawl4AiClient本身

构造方法带base_url、token、超时。

默认超时30秒。

token可选。配置了时用Bearer认证头。

### 2、fetch_markdown方法

它通过Crawl4AI的POST /md端点抓取页面的干净markdown。

参数是url和filter_mode。

filter_mode是Crawl4AI markdown过滤器。

fit、raw、bm25、llm。

非200返回HTTP错误。文本截断200字符。

非JSON的200响应用content-type报告。

success为False时报告失败。

空markdown时报告空。

超时和请求错误都转成Error字符串。

### 3、crawl4ai/tools.py对照

tools.py提供web_fetch_tool。

SSRF检查用validate_public_http_url。

allow_private_addresses可配置。

_readability_extractor提取正文。

结果截断4096字符。

### 4、SearxngClient对照

searxng_client.py是自托管SearXNG服务器的客户端。

web_search带time_range。

### 5、JinaClient对照

jina_client.py是Jina AI reader的客户端。

web_fetch用reader端点。

支持proxy配置。

## 三、它和谁协作

- Crawl4AI Docker服务器是外部抓取端。
- crawl4ai/tools.py的web_fetch_tool调用它。
- validate_public_http_url做SSRF检查。
- ReadabilityExtractor可选提取。

## 四、重要性评级

评级是3分。

理由如下。

这个类是自托管抓取服务的客户端。

错误处理完整。

非JSON的200响应用content-type报告。

token可选Bearer认证。

这些质量不错。

扣掉7分。

扣分原因是它是薄HTTP客户端。

逻辑直接。
