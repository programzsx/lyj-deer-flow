# deerflow.community.browserless档案

本文档解读`deerflow.community.browserless`这个包。

本文档基于对包内三个代码文件的实际阅读。

这三个文件是`__init__.py`、`browserless_client.py`、`tools.py`。

本文档的读者是想理解这套代码的开发者。

## 一、这个包是干什么的

这个包是Browserless无头浏览器服务的工具集成。

Browserless是一个无头Chrome渲染服务。

服务提供HTTP API。

调用方发一个URL过去。

服务用真实的Chrome把页面渲染好。

然后返回渲染后的HTML或截图。

这个包基于这个服务给DeerFlow提供两个工具。

第一个是`web_fetch`。

`web_fetch`抓取网页内容并转成markdown。

第二个是`web_capture`。

`web_capture`给网页截图并保存为artifact。

这个包解决的问题是JavaScript渲染。

很多页面靠JS加载数据。

普通HTTP请求拿到的HTML是空壳。

Browserless用真Chrome渲染后内容就全了。

这个包是可选的社区贡献。

需要用户自己部署或购买Browserless服务。

## 二、包里的主要成员

### 1、`BrowserlessClient`

`BrowserlessClient`定义在`browserless_client.py`里。

这个类是Browserless HTTP API的客户端。

这个类用httpx发请求。

构造参数是base_url、token、timeout_s。

默认地址是`http://localhost:3032`。

默认超时30秒。

这个类有三个主要方法。

`fetch_html`抓取渲染后的HTML。

这个方法返回纯字符串契约。

要么返回HTML。

要么返回`Error: ...`字符串。

`fetch_html_with_status`是带状态版的抓取。

这个方法返回`BrowserlessFetchResult`对象。

对象里带目标页面的真实状态码。

带状态的原因如下。

Browserless对渲染请求本身返回HTTP 200。

目标页面可能其实是4xx、5xx或反爬拦截页。

光看200分不出真假成功。

所以需要X-Response-Code和X-Response-Status头。

这两个头记录目标页面的真实状态。

请求发到`{base_url}/content`端点。

payload支持多个等待参数。

`waitForEvent`等页面事件。

`waitForTimeout`页面加载后额外等待。

`waitForSelector`等指定CSS选择器出现。

`rejectResourceTypes`屏蔽指定资源类型。

`rejectRequestPattern`屏蔽指定URL模式。

只发送当前API版本接受的参数。

`capture_screenshot`抓取页面截图。

请求发到`{base_url}/screenshot`端点。

参数包括fullPage、输出格式、质量、视口大小、等待参数。

`bestAttempt`参数让等待超时后继续截图。

成功返回`BrowserlessScreenshotResult`。

结果里是图片二进制、Content-Type、目标状态、最终URL。

错误处理统一返回`Error: ...`字符串。

超时、请求失败、HTTP错误、空响应都有各自的错误信息。

### 2、`web_fetch_tool`

`web_fetch_tool`定义在`tools.py`里。

这是一个LangChain工具。

工具名是`web_fetch`。

工具流程是五步。

第一步做SSRF校验。

校验用共享的`validate_public_http_url`。

校验拦截解析到内网、环回、链路本地的地址。

云元数据地址`169.254.169.254`也在拦截范围。

运维可以用`allow_private_addresses`显式放开内网。

第二步构造客户端。

客户端配置从工具配置读。

支持base_url、token、超时。

token也回退到`BROWSERLESS_TOKEN`环境变量。

第三步调用client抓取HTML。

第四步用ReadabilityExtractor做正文提取。

提取是CPU密集的。

所以用`asyncio.to_thread`放到线程里跑。

第五步把文章转成markdown。

输出截断到4096字符。

目标页面真实状态异常时附加警告。

警告形如`warning: target page responded 403 Forbidden`。

超时配置有个兼容设计。

`browserless`文档用的键是`timeout_s`。

兄弟包`crawl4ai`和`jina_ai`用的键是`timeout`。

两个键都接受。

两个都有时优先用文档的`timeout_s`。

不认识的键会被静默丢弃。

用户照抄别家配置片段时至少拿得到默认值。

超时值的强制转换也有保护。

布尔值和非法字符串回退到默认。

YAML里的`timeout_s: off`不会变成0秒。

### 3、`web_capture_tool`

`web_capture_tool`也定义在`tools.py`里。

这也是一个LangChain工具。

工具名是`web_capture`。

工具给网页截图。

截图保存到线程的outputs目录。

输出作为artifact返回。

这个工具的流程如下。

第一步SSRF校验。

第二步取线程outputs路径。

路径来自Runtime的thread_data。

拿不到就报错。

第三步合并配置。

配置项包括输出格式、full_page、视口、质量、等待参数。

输出格式支持png、jpeg、webp。

非法格式回退到png。

质量参数只对jpeg和webp生效。

第四步构造客户端并调用截图。

第五步写文件。

文件名做了清洗。

非法字符替换成下划线。

截断到100字符。

文件名冲突时追加`-1`、`-2`后缀。

显式文件名绝不静默覆盖旧文件。

冲突探测上限1000次。

目录饱和时回退到时间戳后缀。

结果消息也附带目标状态警告。

### 4、辅助数据类和函数

`BrowserlessFetchResult`是抓取结果。

字段是html、target_status_code、target_status。

`BrowserlessScreenshotResult`是截图结果。

字段是content、content_type、target_status_code、target_status、final_url。

`_dedupe_output_name`处理文件名冲突。

`_target_status_warning`生成目标页异常的警告文案。

`_as_str_list`接受字符串列表和逗号分隔字符串两种写法。

## 三、它和谁协作

### 1、依赖的上游

这个包依赖Browserless服务本身。

服务可以是自建的Docker镜像。

服务可以是Browserless的云服务。

服务地址通过`base_url`配置。

默认地址是本机3032端口。

认证用token。

token来自工具配置或`BROWSERLESS_TOKEN`环境变量。

这个包依赖httpx发HTTP请求。

这个包依赖DeerFlow的核心模块。

依赖`deerflow.community.url_safety`做SSRF校验。

依赖`deerflow.config`读工具配置。

依赖`deerflow.config.paths`的`VIRTUAL_PATH_PREFIX`。

依赖`deerflow.tools.types`的`Runtime`。

依赖`deerflow.utils.readability`的`ReadabilityExtractor`做正文提取。

依赖LangChain和LangGraph的工具协议。

### 2、服务的下游

这个包被DeerFlow的lead agent调用。

用户在`config.yaml`里启用`web_fetch`或`web_capture`工具并配置browserless后即可使用。

这两个工具名和Tavily等其他provider的web_fetch同名。

DeerFlow按配置选择用哪个provider的实现。

## 四、重要性评级

评级：5分。

理由如下。

这个包解决的是JS渲染页面的抓取和截图问题。

这个问题真实存在。

普通HTTP抓取拿不到JS渲染的内容。

这个包的实现质量不错。

目标页面真实状态的透出、文件名冲突保护、超时配置兼容、SSRF校验都有细致处理。

公共字符串契约和带状态结果对象的分层也清晰。

但是这个包体量小。

两个客户端方法加两个工具。

逻辑大部分是HTTP请求参数拼装。

这个包依赖外部Browserless服务。

DeerFlow默认不配置这个服务。

同类功能有多个替代provider。

Jina、Crawl4AI、Unbrowse都能做web_fetch。

浏览器自动化包能做更强的交互式截图。

所以评级定为5分：有用的可选工具集成，体量小、定位边缘。
