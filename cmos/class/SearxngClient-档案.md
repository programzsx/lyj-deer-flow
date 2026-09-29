# SearxngClient-档案

## 一、这个类是干什么的

SearxngClient是community/searxng/searxng_client.py里的类。

它是SearXNG元搜索引擎API的客户端。

SearXNG是自托管的元搜索引擎。

这个类位于backend/packages/harness/deerflow/community/searxng/searxng_client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、SearxngClient本身

构造方法带base_url。

### 2、search方法

它用SearXNG搜索web。

SearXNG的search API没有limit参数。

/search回答一页结果。

实例的results_per_page。默认10。

交给它的limit被忽略。

所以max_results大于一页时必须走pageno收集。

_MAX_PAGES为5。

cap这个走页。意外大的max_results不能扇出成无界请求。

假值表示无cap。

结果按url或title去重。

一页没有新增说明实例在重复自己或query穷尽。不再问。

### 3、_search_page方法

它抓一页结果。

limit故意不发送。

它不是SearXNG search API的一部分。

time_range是可选相对窗口。

### 4、JinaClient对照

jina_ai/jina_client.py是Jina AI reader的客户端。

crawl方法打https://r.jina.ai/。

X-Return-Format头控制返回格式。

JINA_API_KEY设置时用Bearer。

未设置时警告一次。

提示提供自己的key获得更高速率限制。

proxy可选。trust_env默认True。

### 5、infoquest对照

infoquest_client.py是infoquest服务的客户端。

web_search、web_fetch、image_search三个工具。

## 三、它和谁协作

- SearXNG实例是外部元搜索引擎。
- searxng/tools.py的web_search_tool调用它。
- SearchTimeRange来自community/search_time_range.py。

## 四、重要性评级

评级是3分。

理由如下。

这个类是自托管元搜索引擎的客户端。

分页收集处理SearXNG无limit参数。

去重。空新增时停止。

_MAX_PAGES cap防无界请求。

这些细节不错。

扣掉7分。

扣分原因是它是薄HTTP客户端。
