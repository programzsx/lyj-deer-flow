# 模块档案：deerflow.community.unbrowse.tools

## 一、这个模块是干什么的

这个模块定义一个Agent工具。
工具名是web_fetch。
底层是Unbrowse。
Unbrowse是一个把网站变成Agent API的托管服务。
这个provider调用它的unbrowse.scrape工具。
这个工具把页面返回成markdown。
页面用普通HTTP就够时走普通HTTP。
页面需要JavaScript渲染时走云浏览器。
调用打到Unbrowse的MCP端点。
就是https://unbrowse.ai/api/mcp。
用一次JSON-RPC的tools/call POST请求。
使用它需要API key。
在unbrowse.ai/app获取。

## 二、模块里的主要成员

（1）web_fetch_tool
这是唯一的Agent工具。
参数只有url。
docstring和其他web_fetch提供商保持一致。
只抓取精确URL。
不能访问登录内容。
URL必须带协议。
它先取API key。
没有key返回错误。
然后从配置读render模式。
render取值有三种。
auto是默认。
auto表示页面需要JS时自动用云浏览器。
never表示永不用云浏览器。
always表示总用云浏览器。
无效值打警告并回退默认。
请求参数是url、formats指定markdown、render。
返回的markdown截断到4096字符。
标题从metadata里取。
取不到用Untitled。

（2）_call_unbrowse_tool
这个函数调用一个Unbrowse MCP工具。
发一次JSON-RPC的tools/call请求。
带Bearer授权。
返回data加error元组。
超时90秒。
比其他抓取provider长。
因为云浏览器渲染慢。
错误处理有几层。
HTTP状态错误返回错误。
JSON-RPC的error字段返回错误。
result是工具级错误时。
isError字段为true。
返回错误文本。
structuredContent是字典时直接返回。
否则尝试把文本块解析成JSON。
解析失败返回格式错误。

（3）响应辅助函数
_tool_result_text拼接MCP工具结果的文本块。
content是块列表。
每个块取text字段。
_clip把字段转成文本并截断。
0表示不截断。
_resolve_render校验render模式。
_missing_key_message在key缺失时返回错误。
每个工具只告警一次。

## 三、它和谁协作

这个模块依赖谁。
依赖httpx发HTTP请求。
依赖langchain的tool装饰器。
依赖deerflow.config。

谁调用这个模块。
DeerFlow的工具框架把它注册成Agent的web_fetch工具。
config.yaml的tools列表里配置web_fetch用这个提供商才启用。

## 四、重要性评级

评级：3分。
理由：这是一个单工具的可选web_fetch提供商。174行。它通过MCP协议调用Unbrowse。JSON-RPC的错误处理有几层。render模式自动选择普通HTTP或云浏览器。但它功能单一，需要API key。使用面窄。给3分。
