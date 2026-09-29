# sofya-and-unbrowse-tools-档案

## 一、这个类是干什么的

sofya和unbrowse是community下两个类似结构的工具模块。

sofya/tools.py是SofYA搜索工具。

unbrowse/tools.py是Unbrowse抓取工具。

两者都是API key集成的web工具。

sofya提供web_search。

unbrowse提供web_fetch。

API key从环境变量读。或config.yaml提供。

这个文档覆盖两个模块。

位于backend/packages/harness/deerflow/community/sofya/tools.py和backend/packages/harness/deerflow/community/unbrowse/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、sofya的web_search_tool

web_search按query搜索。

max_results省略时用配置值。默认5。上限20。

调用方提供的max_results优先。

search_depth和content limit从配置读。

time_range映射freshness。

payload带query、max_results、search_depth。

### 2、_sofya_post

POST到Sofya端点。

Bearer认证头。

返回(data, error)元组。

成功时data是解析JSON。error为None。

失败时data为None。error是可交给模型的消息。

### 3、unbrowse的web_fetch_tool

unbrowse通过MCP JSON-RPC tools/call调用。

_call_unbrowse_tool发一个JSON-RPC tools/call请求。

rpc_error时提取message。

isError时提取工具错误。

structuredContent优先。

否则解析JSON文本。

render参数从配置解析。

markdown内容截断。

### 4、key警告

两者都用_api_key_warned集合。

每个工具名只警告一次。

提示设置环境变量或config.yaml的api_key。

### 5、_clip

规整结果字段为文本并截断。

limit为0表示不截断。

### 6、serply对照

serply模块类似。

支持vertical参数。

## 三、它和谁协作

- SofYA和Unbrowse API是外部服务端。
- get_app_config提供工具配置。
- SearchTimeRange映射freshness。

## 四、重要性评级

评级是3分。

理由如下。

两个模块是可选搜索和抓取集成。

结构化错误处理。

MCP JSON-RPC调用解析完整。

rpc_error和isError分开处理。

key警告每工具一次。

扣掉7分。

扣分原因是薄集成。逻辑直接。
