# 模块档案：deerflow.community.infoquest.tools

## 一、这个模块是干什么的

这个模块定义三个Agent工具。
第一个工具叫web_search。
它用InfoQuest做网页搜索。
第二个工具叫web_fetch。
它用InfoQuest抓取页面。
抓到的HTML经过readability提取正文。
输出markdown。
截断到4096字符。
第三个工具叫image_search。
它用InfoQuest搜图片。
用途是在图片生成之前搜参考图。
InfoQuest是字节跳动的搜索和抓取API。
使用它需要环境变量INFOQUEST_API_KEY。
配置里每个时间相关选项用-1表示不做时间过滤。

## 二、模块里的主要成员

（1）web_search_tool
这是web_search工具。
参数只有query。
构建客户端后直接调用client.web_search。

（2）web_fetch_tool
这是web_fetch工具。
参数只有url。
调用client.fetch拿到HTML。
结果以Error:开头就直接返回。
否则用readability提取正文。
readability提取是CPU密集操作。
所以通过asyncio.to_thread调用。
输出markdown截断到4096字符。

（3）image_search_tool
这是image_search工具。
参数只有query。
docstring写得很细。
指导模型在生成图片前先搜参考图。
构建客户端后直接调用client.image_search。

（4）_get_infoquest_client
这个函数构建客户端。
它从三个工具配置块读参数。
web_search配置读search_time_range。
web_fetch配置读fetch_time、timeout、navigation_timeout。
image_search配置读image_search_time_range、image_size。

（5）_coerce_seconds
这个函数归一化爬取超时选项。
为什么需要它。
config.yaml里的$VAR引用从环境变量原样解析。
配置的timeout: $FETCH_TIMEOUT到达时是字符串"10"。
客户端用0比较这些选项。
字符串、None、映射比较会直接抛异常。
整个调用就挂了。
只有整数、整数浮点、整数字符串被接受。
普通int()会静默截断3.5。
还会把true变成1。
其他情况打警告并保留默认值-1。

## 三、它和谁协作

这个模块依赖谁。
依赖同目录的infoquest_client模块。
依赖deerflow.utils.readability的ReadabilityExtractor。
依赖deerflow.config。

谁调用这个模块。
DeerFlow的工具框架把这三个工具注册给Agent。
config.yaml的tools列表里配置了才启用。

## 四、重要性评级

评级：3分。
理由：这是一个三工具的可选提供商模块。133行。工具本身是薄封装。亮点在_coerce_seconds对$VAR字符串配置的防御。配置错误会让整个调用抛异常。处理掉这个问题需要细致的强转逻辑。但提供商本身使用面窄。给3分。
