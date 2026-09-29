# browserless-web-tools-档案

## 一、这个类是干什么的

browserless模块不是单个类。

它是community/browserless/目录下的工具集。

包括browserless_client.py和tools.py。

Browserless是无头Chrome渲染服务。

tools.py提供web_fetch和web_capture两个工具。

web_fetch抓取网页内容。

web_capture捕获渲染后的网页截图并作为artifact呈现。

适用于JavaScript重的页面、UI状态、仪表盘、报告的视觉证据。

这个模块位于backend/packages/harness/deerflow/community/browserless/。

## 二、类的成员（字段、方法，各自做什么）

### 1、web_fetch_tool

web_fetch抓取指定URL的网页内容。

只fetch用户直接提供的或web_search和web_fetch返回的精确URL。

不能访问需要认证的内容。例如私有Google Docs或登录墙后的页面。

不要给没有www的URL加www。

URL必须含schema。

URL先经过validate_public_http_url做SSRF检查。

allow_private_addresses是显式opt-out。

支持wait_for_event、wait_for_selector、reject_resource_types等配置。

结果用Readability extractor转markdown。

截断4096字符。

### 2、web_capture_tool

web_capture捕获渲染后的网页截图。

filename可选。目录被忽略。扩展名由output_format决定。

支持png、jpeg、webp。

viewport默认1280x720。

full_page默认True。

quality只对jpeg和webp有效。

截图写入outputs目录。

作为virtual path artifact呈现。

### 3、目标状态警告

_target_status_warning返回目标页面自身出错时的警告。

Browserless对render请求返回HTTP 200。

即使目标页面响应4xx或5xx。

或错误页面、反bot页面。

所以原始内容不能信任为正常成功响应。

目标真实状态通过X-Response-Code头surfaced。

### 4、文件名和去重

_safe_capture_filename规整文件名。

目录被忽略。stem清洗。上限100字符。

_dedupe_output_name防覆盖。

原名空闲时保留。

否则加-1、-2后缀。

显式filename永不静默覆盖早先的capture。

探测范围内饱和时回退到时间戳后缀。

### 5、BrowserlessClient

browserless_client.py是Browserless HTTP客户端。

fetch_html_with_status抓HTML带状态。

capture_screenshot捕获截图。

### 6、crawl4ai对照

crawl4ai模块类似。Crawl4AiClient加web_fetch_tool。

结果也用Readability转markdown。

## 三、它和谁协作

- Browserless服务是外部渲染端。
- validate_public_http_url做SSRF检查。
- ReadabilityExtractor提取正文。
- Runtime提供outputs_path。
- artifacts channel接收virtual path。

## 四、重要性评级

评级是6分。

理由如下。

这个模块是无头浏览器渲染集成。

web_fetch和web_capture两条路径。

SSRF检查贯穿。allow_private_addresses显式opt-out。

目标状态警告防止把4xx页面当成功。

文件名去重防覆盖。

Readability提取保持输出紧凑。

这些质量高。

扣掉4分。

扣分原因是它是可选外部服务集成。
