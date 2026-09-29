# BrowserlessFetchResult-档案

## 一、这个类是干什么的

BrowserlessFetchResult是community/browserless/browserless_client.py里的冻结数据类。

它承载一次Browserless渲染抓取的结果。

字段是html加target_status_code加target_status。

这个类位于backend/packages/harness/deerflow/community/browserless/browserless_client.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

html是渲染后的HTML。

target_status_code是目标页的真实状态码。来自X-Response-Code header。

target_status是目标页的状态文本。来自X-Response-Status header。

### 2、为什么带目标状态

Browserless对渲染请求本身总是返回HTTP 200。

目标页可能响应4xx或5xx或反bot拦截页。

没有这个字段调用者分不清真200和渲染成功但目标出错。

### 3、fetch_html的关系

fetch_html只返回result.html。

fetch_html_with_status返回完整结果对象。

## 三、它和谁协作

- BrowserlessClient.fetch_html_with_status构建它。
- community/browserless工具消费它。
- 调用者用target_status警告目标状态。

## 四、重要性评级

评级是4分。

理由如下。

这个类是Browserless抓取结果的载体。

目标页状态保留。区分真200和反bot拦截页。

三个字段。逻辑量小。

扣掉6分。

扣分原因是它是小数据类。
