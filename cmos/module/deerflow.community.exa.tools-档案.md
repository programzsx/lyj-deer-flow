# 模块档案：deerflow.community.exa.tools

## 一、这个模块是干什么的

这个模块定义两个Agent工具。
一个工具叫web_search。
它用Exa搜索网页。
另一个工具叫web_fetch。
它用Exa抓取页面内容。
Exa是一个AI搜索引擎。
它提供Python SDK，就是exa_py。
使用它需要API key。
API key从config.yaml的工具配置里取。
没配置时SDK自己处理。
这个模块的特点是很薄。
它基本就是Exa SDK的直接封装。
加上配置读取和结果归一化。

## 二、模块里的主要成员

（1）web_search_tool
这是web_search工具。
参数只有query。
它从配置读三个值。
max_results默认5。
search_type默认auto。
contents_max_characters默认1000。
调用Exa的search方法。
内容用highlights形式返回。
每个结果限制字符数。
返回结果归一化成title、url、snippet结构。
snippet是highlights拼接。

（2）web_fetch_tool
这是web_fetch工具。
参数只有url。
调用Exa的get_contents方法。
文本限制4096字符。
返回标题加正文。
标题取不到时用Untitled。

（3）_coerce_positive_int
这个函数归一化配置里的正整数。
为什么需要它。
config.yaml里的$VAR引用解析成字符串。
exa-py outright拒绝字符串的num_results。
所以每个搜索都会失败。
只有整数或整数字符串被接受。
普通int()会静默截断浮点数。
比如3.5变成3。
还会把true变成1。
这些都被拒绝。
其他情况打警告并用默认值。

## 三、它和谁协作

这个模块依赖谁。
依赖exa_py库。
exa_py是这个提供商的必需依赖。
依赖deerflow.config。

谁调用这个模块。
DeerFlow的工具框架把它注册给Agent。
config.yaml的tools列表里配置了才启用。
它不依赖url_safety。
因为web_fetch的URL是发给Exa云服务的。
DeerFlow不直接抓取。

## 四、重要性评级

评级：3分。
理由：这是一个很薄的可选搜索提供商。111行。核心就是Exa SDK封装。唯一的亮点是_coerce_positive_int对$VAR字符串配置的处理。不处理它每个搜索都失败。但功能面窄，需要API key。给3分。
