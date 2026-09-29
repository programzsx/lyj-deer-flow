# 模块档案：deerflow.community.serply.tools

## 一、这个模块是干什么的

这个模块定义一个Agent工具。
工具名是web_search。
底层是Serply。
Serply返回实时的Google结果。
以JSON形式。
一个API key覆盖三个垂直领域。
常规网页SERP。
Google新闻。
Google学术。
研究任务可以在config.yaml里切换vertical。
指向最近的报道。
或者指向学术论文。
使用它需要API key。
在serply.io注册。

## 二、模块里的主要成员

（1）web_search_tool
这是唯一的Agent工具。
参数有query和max_results。
max_results默认5。
上限100。
Serply的num参数接受1到100。
从配置里可覆盖。
query清理到500字符。
API key从两个地方取。
先配置后环境变量SERPLY_API_KEY。
没有key返回结构化错误。
每个工具名只告警一次。

（2）垂直领域支持
_VERTICALS字典定义三个垂直领域。
每个领域对应URL路径段和响应键。
search对应search路径和results键。
news对应news路径和entries键。
scholar对应scholar路径和articles键。
vertical从配置读取。
无效值打警告并回退默认search。
gl和hl参数从配置原样透传。
gl是地理定位。
hl是界面语言。

（3）_normalize_row
这个函数把一行Serply结果映射到通用的title、url、content形状。
新闻和学术行有值得展示的额外字段。
新闻行提取content、published、source。
content经过清理。
新闻摘要到达时是HTML。
清理去HTML标签并反转义HTML实体。
学术行提取authors、cited_by、pdf_url。
作者列表从author结构里取。
引用数从extras的citations里取。
pdf链接从doc结构里取。

（4）请求辅助函数
_serply_get发送GET请求。
返回data加error_json元组。
成功时data是JSON响应。
失败时error_json是结构化错误。
HTTP状态错误和其他异常都翻译成错误JSON。
错误文本截断到500字符。

## 三、它和谁协作

这个模块依赖谁。
依赖httpx发HTTP请求。
依赖langchain的tool装饰器。
依赖deerflow.config。

谁调用这个模块。
DeerFlow的工具框架把它注册给Agent。
config.yaml的tools列表里配置了才启用。

## 四、重要性评级

评级：4分。
理由：这是一个Google搜索API的可选提供商。它的亮点是三个垂直领域的统一支持。一套key覆盖网页、新闻、学术。新闻行的HTML清理是针对真实数据格式的处理。新闻feed忽略num参数所以客户端也做上限。它是可选集成。给4分。
