# BrowserlessScreenshotResult-档案

## 一、这个类是干什么的

BrowserlessScreenshotResult是community/browserless/browserless_client.py里的冻结数据类。

它承载一次Browserless截屏的结果。

字段是content加content_type加目标状态加final_url。

这个类位于backend/packages/harness/deerflow/community/browserless/browserless_client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

content是截屏二进制内容。

content_type是MIME类型。来自Content-Type header。

target_status_code来自X-Response-Code header。

target_status来自X-Response-Status header。

final_url来自X-Response-URL header。重定向后的最终URL。

### 2、截屏请求

capture_screenshot构建它。

POST {base_url}/screenshot。token走query参数。

状态码非200返回Error字符串。空content返回Error字符串。

## 三、它和谁协作

- BrowserlessClient.capture_screenshot构建它。
- community/browserless工具消费它。
- 调用者用final_url追踪重定向。

## 四、重要性评级

评级是3分。

理由如下。

这个类是Browserless截屏结果的载体。

二进制content加MIME类型加最终URL。

五个字段。无逻辑。

扣掉7分。

扣分原因是它是纯数据载体。
