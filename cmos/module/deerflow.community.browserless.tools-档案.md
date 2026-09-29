# 模块档案：deerflow.community.browserless.tools

## 一、这个模块是干什么的

这个模块定义两个Agent工具。
一个工具叫web_fetch。
它用Browserless无头Chrome抓取网页。
抓取的是渲染后的HTML。
然后经过readability提取正文。
输出markdown。
输出截断到4096字符。
另一个工具叫web_capture。
它用Browserless渲染网页并截图。
截图作为交付物呈现给用户。
适合JavaScript重的页面、UI状态、仪表盘、报告配图。
这两个工具都做SSRF校验。
校验用共享的validate_public_http_url。
运营者可以通过allow_private_addresses配置放开内网目标。

## 二、模块里的主要成员

（1）web_fetch_tool
这是web_fetch工具。
参数只有url。
工具的docstring写得很细。
只抓取用户直接给出的或搜索结果里的精确URL。
不能访问需要登录的内容。
不要给URL加www。
URL必须带协议。
它从配置读取allow_private_addresses。
抓取成功后用readability提取正文。
readability提取是CPU密集操作。
所以永远通过asyncio.to_thread调用。
正文截断到4096字符。
如果目标页面真实状态是4xx或5xx。
返回文本尾部附上警告。
警告来自X-Response-Code头。

（2）web_capture_tool
这是web_capture工具。
参数有url、filename、full_page、output_format、viewport_width、viewport_height。
每个参数都可以被配置覆盖。
格式支持png、jpeg、webp。
质量参数只对jpeg和webp生效。
文件名做安全化处理。
非法字符替换成下划线。
文件名冲突时追加-1、-2序号。
冲突探测有上限。
上限是1000次。
防止饱和目录无限探测。
探测超限就退回时间戳后缀。
截图写入线程的outputs目录。
然后作为artifacts条目返回。

（3）配置辅助函数
_coerce_timeout把配置里的超时值转成秒。
布尔值和非数字字符串回退到默认值。
这样配置写成off不会变成0.0。
0.0会让每个请求都超时。
_resolve_timeout同时接受timeout_s和timeout两个键。
browserless文档用timeout_s。
crawl4ai和jina_ai用timeout。
两种写法都认。
防止用户照抄别家配置片段后静默拿到默认值。
_as_str_list把配置值转成字符串列表。
接受字符串列表和逗号分隔字符串两种写法。

## 三、它和谁协作

这个模块依赖谁。
依赖同目录的browserless_client模块。
依赖deerflow.community.url_safety。
依赖deerflow.utils.readability的ReadabilityExtractor。
依赖deerflow.config。

谁调用这个模块。
DeerFlow的工具框架把这两个工具注册给Agent。
config.yaml里配置了才启用。

## 四、重要性评级

评级：4分。
理由：这是可选web_fetch后端的工具层。它的亮点在配置健壮性上。超时值、布尔值、列表值的强转都有防御。文件名冲突有上限探测。这些细节防止了配置错误导致的全量请求超时。但它是多个可选抓取后端之一。给4分。
