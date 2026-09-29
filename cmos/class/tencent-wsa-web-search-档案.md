# tencent-wsa-web-search-档案

## 一、这个类是干什么的

tencent_wsa模块不是单个类。

它是community/tencent_wsa/目录下的工具模块。

它是腾讯云Web Search API的web搜索工具。

web_search按query搜索。

API key从环境变量TENCENT_WSA_API_KEY读。

或config.yaml提供api_key。

这个模块位于backend/packages/harness/deerflow/community/tencent_wsa/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、web_search_tool

web_search按query搜索。

max_results默认5。可从工具配置覆盖。

query规整。空的返回错误。

payload带Query、可选Mode、可选Cnt。

_mode是搜索模式。

_request_count把max_results换算成API请求计数。

向上取整到API的结果计数倍数。

### 2、_search函数

POST打搜索端点。

Bearer认证头。charset utf-8。

HTTP状态错误、HTTP错误、JSON错误都转成结构化error。

非字典payload报意外格式。

### 3、_get_response函数

它提取Response对象。

request_id从RequestId取。

Error对象时抛错。code规整。UnknownCode报UnknownError。

request_id带进错误。

### 4、_parse_results函数

它解析Pages。

Pages可以是JSON字符串数组或对象数组。

文档schema是JSON字符串数组。

也接受对象。保持前向兼容无害的API表示变化。

畸形页跳过并警告。

title、url、content或passage。

date、site、score字段接受字符串数字。布尔拒绝。

达到max_results停止。

### 5、_missing_key_error

key未配置时警告一次。

每个工具名只警告一次。

_api_key_warned集合跟踪。

错误带request_id可选。

### 6、serply和sofya对照

serply是serply搜索。支持vertical。

sofya是sofya搜索。支持search_depth和content limit。

unbrowse是unbrowse工具调用。支持render。

结构都类似。

## 三、它和谁协作

- 腾讯云Web Search API是搜索后端。
- get_app_config提供工具配置。
- web_fetch工具配合搜索结果。

## 四、重要性评级

评级是3分。

理由如下。

这个模块是腾讯云搜索集成的实现。

request_id贯穿错误和输出。可诊断。

Pages解析前向兼容JSON字符串和对象。

key警告每个工具一次。

这些细节不错。

扣掉7分。

扣分原因是它是可选搜索集成。
