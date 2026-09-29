# 模块档案：deerflow.community.infoquest.infoquest_client

## 一、这个模块是干什么的

这个模块定义InfoQuestClient类。
InfoQuest是字节跳动的网络搜索和抓取API。
它的文档在byteplus.com上。
这个客户端封装它的三个能力。
第一个能力是网页搜索。
第二个能力是图片搜索。
第三个能力是页面抓取。
客户端是异步的。
底层用httpx.AsyncClient。
本地连接和读取的不活动超时是30秒。
这个超时和远程爬取的超时分开。
fetch_timeout和fetch_navigation_timeout只配置远程爬取。
httpx默认的超时只有5秒。
这里特意设了30秒。

## 二、模块里的主要成员

（1）InfoQuestClient类
构造参数有六项。
fetch_time是抓取时长。
fetch_timeout是抓取超时。
fetch_navigation_timeout是导航超时。
search_time_range是搜索时间范围。
image_search_time_range是图片搜索时间范围。
image_size是图片大小。
每项用-1表示不限制。
构造时记录API key是否已配置。
DEBUG级别下打印完整的配置详情。

（2）fetch方法
这个方法抓取单个页面。
POST到reader.infoquest.bytepluses.com。
请求体是url加format。
配置了正值的超时参数才加入请求体。
响应处理有几层。
状态码不是200返回错误。
空响应返回错误。
JSON里有reader_result字段就提取它。
没有reader_result但有content字段就回退到content。
都不是就返回原始响应。
响应不是JSON就返回原始文本。

（3）web_search方法
这个方法做网页搜索。
POST到search.infoquest.bytepluses.com。
配置了正值time_range才传。
site参数可传。
clean_results静态方法清洗原始结果。
organic结果标成page类型。
top_stories结果标成news类型。
URL去重。
计数分pages和news。

（4）image_search方法
这个方法做图片搜索。
time_range有效范围是1到365。
超出范围打警告并忽略。
image_size必须是l、m、i之一。
无效打警告。
clean_results_with_image_search清洗图片结果。
提取original作为image_url。
URL去重。

## 三、它和谁协作

这个模块依赖谁。
只依赖httpx和标准库。
API key从环境变量INFOQUEST_API_KEY取。
header里加Bearer授权。

谁调用这个模块。
同目录的tools.py调用它。
tools.py里的web_search、web_fetch、image_search工具构建这个客户端。
仓库的测试在tests/test_infoquest_http_timeout.py验证超时分离。

## 四、重要性评级

评级：3分。
理由：这是一个自包含的API客户端封装。400多行。它把搜索、图片搜索、抓取三个能力封装到一个客户端。DEBUG日志很详细。响应解析有多层回退。超时分离是一个经过测试验证的细节。但它是可选的第三方提供商。使用面窄。给3分。
