# 模块档案：deerflow.community.sofya.tools

## 一、这个模块是干什么的

这个模块定义两个Agent工具。
一个工具叫web_search。
一个工具叫web_fetch。
底层是Sofya。
Sofya是一个面向Agent的托管网络API。
它的搜索返回结果页面的内容。
不只是片段。
它的抓取返回单个页面的干净markdown。
使用它需要API key。
在sofya.co注册。
这个模块是自包含的。
只用httpx。

## 二、模块里的主要成员

（1）web_search_tool
这是web_search工具。
参数有query、max_results、time_range。
max_results可以省略。
省略时用配置值。
默认5。
上限20。
调用方传入的值优先。
只有省略时才回退到配置。
time_range是可选的相对时间窗口。
请求体里叫freshness。
值直接透传。
Sofya支持day、week、month、year。
search_depth从配置读取。
取值有basic和snippets。
默认basic。
无效值打警告并回退默认。
contents_max_characters从配置读取。
控制每个结果的内容上限。
0表示不限制。
无效值回退默认2000。
返回结果归一化成title、url、content结构。
content优先用页面内容。
没有页面内容时用搜索片段。
内容截断。
让正常搜索保持内联。
而不是被写到磁盘。

（2）web_fetch_tool
这是web_fetch工具。
参数只有url。
POST到fetch端点。
请求体是urls数组。
返回结果取第一个。
结果里有success字段。
success为false时返回错误信息。
content截断到4096字符。
标题从结果里取。
取不到用Untitled。

（3）请求辅助函数
_sofya_post发送POST请求。
带Bearer授权。
返回data加error元组。
超时60秒。
HTTP状态错误和其他异常都翻译成错误消息。
错误文本截断到500字符。
_missing_key_message在key缺失时返回错误。
每个工具只告警一次。
_clip把字段转成文本并截断。
0表示不截断。
_response_results提取结果字典列表。
null当无结果。
非列表当格式错误。

## 三、它和谁协作

这个模块依赖谁。
依赖httpx发HTTP请求。
依赖langchain的tool装饰器。
依赖search_time_range模块的SearchTimeRange类型。
依赖deerflow.config。

谁调用这个模块。
DeerFlow的工具框架把它注册给Agent。
config.yaml的tools列表里配置了才启用。

## 四、重要性评级

评级：4分。
理由：这是一个托管网络API的可选提供商。它的特点是搜索直接返回页面内容。这和只返回片段的普通搜索引擎不同。时间范围参数直接透传。内容上限的处理细致。0表示不限制。调用方参数优先于配置。它是可选集成。给4分。
