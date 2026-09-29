# BrowserlessClient-档案

## 一、这个类是干什么的

BrowserlessClient是community/browserless/browserless_client.py里的类。

它是Browserless无头Chrome API的客户端。

它获取渲染后的HTML。它截屏。

这个文档覆盖BrowserlessClient加BrowserlessFetchResult、BrowserlessScreenshotResult。

位于backend/packages/harness/deerflow/community/browserless/browserless_client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造方法

base_url去掉尾部斜杠。

token默认空字符串。

timeout_s默认30秒。

### 2、fetch_html方法

它获取页面的渲染后HTML。

公共字符串契约。它总是返回渲染后HTML或"Error: ..."字符串。

不返回更富的结果对象。

它委托给fetch_html_with_status。取result.html。

### 3、fetch_html_with_status方法

它获取HTML带目标状态。

成功时返回BrowserlessFetchResult。带目标页的真实状态header。

这样调用者能区分真200和渲染成功但目标出错或反bot拦截的响应。

只发送当前Browserless API版本接受的参数。

通过query参数设置默认导航超时30秒。

POST {base_url}/content。

状态码非200返回Error字符串。body截断200字符。

空HTML返回Error字符串。

### 4、capture_screenshot方法

它截屏URL。

full_page默认True。

output_format支持png、jpeg、webp。

quality用于jpeg/webp。

viewport可选。

wait_for_selector等待选择器。

best_attempt为True时等待超时继续。

POST {base_url}/Screenshot。token走query参数。

返回BrowserlessScreenshotResult或Error字符串。

### 5、X-Response-Code和X-Response-Status

Browserless在响应header里带目标页的真实状态。

X-Response-Code是目标状态码。

X-Response-Status是目标状态文本。

X-Response-URL是最终URL。

_get_header按原名和lower再查一次。

### 6、错误处理

TimeoutException返回超时Error字符串。

RequestError记录error返回Error字符串。

其他异常也返回Error字符串。

## 三、它和谁协作

- community/browserless工具调用这个客户端。
- httpx做HTTP请求。
- 调用者用target_status警告目标状态。

## 四、重要性评级

评级是5分。

理由如下。

这个类是Browserless抓取和截屏的客户端。

fetch_html_with_status保留目标页真实状态。渲染请求本身总是200。

公共字符串契约明确。fetch_html永不抛出。错误是数据。

X-Response-Code让调用者区分反bot拦截页。

这些质量不错。

扣掉5分。

扣分原因是它是单provider的薄HTTP客户端。
