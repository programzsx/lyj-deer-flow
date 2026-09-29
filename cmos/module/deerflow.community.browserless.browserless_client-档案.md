# 模块档案：deerflow.community.browserless.browserless_client

## 一、这个模块是干什么的

这个模块定义BrowserlessClient类。
Browserless是一个无头Chrome的托管API服务。
这个客户端调用它的两个端点。
一个端点是/content。
这个端点返回页面的渲染后HTML。
一个端点是/screenshot。
这个端点返回页面的渲染后截图。
它是异步客户端。
底层用httpx.AsyncClient。
这个模块只做HTTP通信。
不做URL校验。
不做HTML解析。
那些职责在上层的tools.py里。

## 二、模块里的主要成员

（1）BrowserlessFetchResult数据类
这是一个冻结的数据类。
字段有html、target_status_code、target_status。
target状态头携带目标页面的真实HTTP状态。
为什么需要它。
Browserless对渲染请求本身返回HTTP 200。
就算目标页面实际回了4xx或5xx。
或者目标页面是反爬拦截页。
渲染请求依然是200。
所以只看HTTP状态码分不清真假成功。
调用方需要这个字段才能分辨。

（2）BrowserlessScreenshotResult数据类
字段有content、content_type、target_status_code、target_status、final_url。
content是二进制图片内容。
final_url来自X-Response-URL头。

（3）BrowserlessClient类
构造参数有base_url、token、timeout_s。
默认超时30秒。
fetch_html_with_status是完整版抓取方法。
payload支持这些参数。
waitForEvent等待页面事件。
waitForTimeout加载后额外等待。
waitForSelector等待CSS选择器出现。
rejectResourceTypes按资源类型拦截。
rejectRequestPattern按URL模式拦截。
成功时返回BrowserlessFetchResult。
失败时返回"Error: ..."开头的字符串。
这是公共字符串契约。
fetch_html是简化版。
内部直接调fetch_html_with_status。
只返回HTML或错误字符串。
调用方只要HTML时用它。
capture_screenshot抓取截图。
支持全页、格式png/jpeg/webp、质量、视口大小、等待参数。
best_attempt为true时等待超时也继续。

## 三、它和谁协作

这个模块依赖谁。
只依赖httpx和标准库。

谁调用这个模块。
同目录的tools.py调用它。
tools.py里的web_fetch和web_capture工具构建这个客户端。
URL校验和readability正文提取都在tools.py完成。
配置来自config.yaml的工具配置。
base_url默认http://localhost:3032。
token默认取环境变量BROWSERLESS_TOKEN。

## 四、重要性评级

评级：4分。
理由：这是一个干净的HTTP客户端封装。它最重要的设计点是target状态头的数据类。这个设计让调用方能分辨"渲染成功但目标页面出错"和"真正的成功"。这个区分对反爬页面的处理很关键。但它只是可选web_fetch后端的通信层，职责单一。所以给4分。
