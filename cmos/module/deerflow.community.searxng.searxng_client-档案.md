# 模块档案：deerflow.community.searxng.searxng_client

## 一、这个模块是干什么的

这个模块定义SearxngClient类。
SearXNG是一个自托管的元搜索引擎。
它聚合多个搜索引擎的结果。
这个客户端调用它的/search API。
返回JSON格式的结果。
客户端是异步的。
底层用httpx.AsyncClient。
它支持时间范围参数。
支持分类参数。
它处理SearXNG API的一个重要限制。
SearXNG的搜索API没有limit参数。
/search每次应答一页结果。
页大小是实例的results_per_page配置。
默认10。
实例会忽略传给它的limit。
所以max_results大于一页时必须翻页收集。
翻页有上限。
最多5页。
防止意外的巨大max_results散发出无界请求。

## 二、模块里的主要成员

（1）SearxngClient类
构造参数只有base_url。
search方法搜索网页。
参数有query、max_results、categories、time_range。
max_results是上限。
必须是正整数。
否则表示不设上限。
time_range是可选的相对时间窗口。
取值是day、week、month、year。
直接透传给SearXNG。
categories是搜索分类。
多个用逗号拼接。

（2）翻页收集逻辑
search方法翻页收集结果。
从第1页开始。
最多第5页。
每页的结果去重。
去重键是URL或标题。
收集数达到上限就返回。
某一页没有新结果就停止。
实例在重复自己或查询已耗尽时不再多请求。
这个设计避免了两类浪费。
一类是无限翻页。
一类是重复请求。

（3）_search_page
这个方法抓取单页结果。
limit故意不发送。
它不是SearXNG搜索API的一部分。
实例会忽略它。
调用方无法区分截断响应和完整响应。
请求参数有q、format、language、pageno。
format是json。
language是auto。
分类和时间范围有条件加入。
请求带User-Agent和Accept头。
超时30秒。
HTTP错误和请求错误都重新抛出。
由上层处理。

## 三、它和谁协作

这个模块依赖谁。
依赖httpx。
依赖search_time_range模块的SearchTimeRange类型。

谁调用这个模块。
同目录的tools.py调用它。
web_search工具构建这个客户端。
base_url默认http://localhost:8088。
从config.yaml可覆盖。

## 四、重要性评级

评级：4分。
理由：这是SearXNG自托管搜索的客户端。它对SearXNG API的限制有准确的理解。没有limit参数所以要翻页。翻页有上限、去重、提前停止三重保护。设计干净。但它是可选提供商的客户端层。需要用户自托管SearXNG实例。给4分。
