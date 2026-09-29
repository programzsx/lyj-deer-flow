# groundroute-tools-档案

## 一、这个类是干什么的

groundroute模块不是单个类。

它是community/groundroute/目录下的工具模块。

GroundRoute是meta搜索层。

一个API在六个搜索引擎前面。

Serper、Brave、Exa、Tavily、Firecrawl、Perplexity。

它把每个query路由到通过质量门槛的最便宜引擎。

并缓存重复。

高量research run在一个引擎宕机时继续工作。

付费不超过直接去单个引擎。

定价是gain-share。

调用方保留约一半的缓存节省。

这个模块自包含。只用httpx。无GroundRoute SDK。

/v1/search请求和响应映射镜像GroundRoute MCP服务器和验证过的Langflow组件。

这个模块位于backend/packages/harness/deerflow/community/groundroute/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、web_search_tool

web_search按query搜索。

max_results默认5。

GroundRoute server端clamp到1到50。

这里也clamp。镜像它。

返回规整JSON列表。

title、url、snippet、source_engine。

### 2、web_fetch_tool

web_fetch通过GroundRoute mode=page读一个URL。

返回提取文本。上限4096字符。

### 3、_get_api_key

它从指定工具的配置块解析GroundRoute key。再环境变量。

tool_name是要读的配置节。

web_search和web_fetch分开。

为fetch跑GroundRoute但为search跑别的引擎的flow仍读对的key。

镜像serper、exa、firecrawl。都接受tool name。

### 4、_coerce_max_results

无效值警告并使用默认。

clamp到1到50。

### 5、_missing_key_error

每个工具警告一次。

_api_key_warned集合跟踪。

### 6、_post_search

POST到/v1/search。

Bearer认证头。

超时30秒。

## 三、它和谁协作

- GroundRoute API是外部meta搜索端。
- get_app_config提供工具配置。
- 六个底层引擎被GroundRoute路由。

## 四、重要性评级

评级是3分。

理由如下。

这个模块是GroundRoute meta搜索集成的实现。

工具分开的key解析。

server端clamp镜像。

key警告每工具一次。

这些细节不错。

扣掉7分。

扣分原因是它是薄HTTP集成。

自包含。逻辑直接。
