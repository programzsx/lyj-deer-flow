# 模块档案：deerflow.community.crawl4ai.crawl4ai_client

## 一、这个模块是干什么的

这个模块定义Crawl4AiClient类。
Crawl4AI是一个可以自托管的爬取服务。
它以Docker服务的形式部署。
这个客户端调用它的POST /md端点。
这个端点直接返回页面的干净markdown。
客户端是异步的。
底层用httpx.AsyncClient。
这个模块只负责HTTP通信和响应检查。
不做URL校验。
不做配置读取。
那些职责在tools.py里。

## 二、模块里的主要成员

（1）Crawl4AiClient类
构造参数有base_url、token、timeout_s。
默认超时30秒。
fetch_markdown方法抓取页面的干净markdown。
参数有url和filter_mode。
filter_mode是Crawl4AI的markdown过滤器。
取值有四种。
fit是默认。
raw是原始。
bm25是关键词过滤。
llm是LLM过滤。
请求体是url加f两个字段。
配置了token时加Bearer授权头。

（2）响应处理
这个方法把所有失败都翻译成"Error: ..."开头的字符串。
分几种失败情况。
HTTP状态码不是200。
返回错误加响应文本前200字符。
状态码200但响应不是JSON。
返回错误加content-type信息。
JSON里success字段为false。
返回错误。
markdown为空。
返回错误。
超时和请求异常也都翻译成错误字符串。

## 三、它和谁协作

这个模块依赖谁。
只依赖httpx和标准库。

谁调用这个模块。
同目录的tools.py调用它。
tools.py里的web_fetch工具构建这个客户端。
URL校验、配置读取、过滤模式校验都在tools.py完成。
base_url默认http://localhost:11235。

## 四、重要性评级

评级：3分。
理由：这是一个很小很干净的HTTP客户端。只有63行。它只做一件事，就是调用Crawl4AI的/md端点并检查响应。所有失败都规整成统一的错误字符串。Crawl4AI本身是可选的自托管抓取后端。使用面窄。职责单一。给3分。
