# 模块档案：deerflow.community.jina_ai.tools

## 一、这个模块是干什么的

这个模块定义一个Agent工具。
工具名是web_fetch。
它用Jina Reader抓取网页。
Jina返回页面的HTML。
HTML经过readability提取正文。
输出markdown。
截断到4096字符。
Jina Reader是一个托管服务。
没有API key也能用。
只是速率限制低。
配置了JINA_API_KEY可以拿到更高速率限制。
这个模块支持配置超时、代理、trust_env。

## 二、模块里的主要成员

（1）web_fetch_tool
这是唯一的Agent工具。
参数只有url。
docstring和其他web_fetch提供商保持一致。
只抓取精确URL。
不能访问登录内容。
URL必须带协议。
工具先构建JinaClient。
然后从配置读三个值。
timeout默认10秒。
proxy默认None。
trust_env默认True。
调用crawl拿HTML。
返回结果以Error:开头就直接返回。
否则用readability提取正文。
readability提取是CPU密集操作。
通过asyncio.to_thread调用。
输出markdown截断到4096字符。

（2）配置强转函数
_coerce_bool把配置值转成布尔。
接受true/false的字符串写法。
_coerce_timeout把配置的超时值转成整数。
布尔值回退到默认。
非数字字符串回退到默认。
_coerce_proxy校验代理。
必须是字符串。
空白回退成None。

## 三、它和谁协作

这个模块依赖谁。
依赖同目录的jina_client模块。
依赖deerflow.utils.readability的ReadabilityExtractor。
依赖deerflow.config。

谁调用这个模块。
DeerFlow的工具框架把它注册成Agent的web_fetch工具。
config.yaml的tools列表里配置web_fetch用这个提供商才启用。
仓库的AGENTS.md提到Jina的日志测试用dummy keys。
在tests/test_jina_client.py。
Jina解析URL时不重建HTML。

## 四、重要性评级

评级：3分。
理由：这是一个单工具的可选提供商。68行。核心是Jina Reader的封装加readability提取。配置强转有基本防御。但功能面窄。给3分。
