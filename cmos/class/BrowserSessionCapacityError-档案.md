# BrowserSessionCapacityError-档案

## 一、这个类是干什么的

BrowserSessionCapacityError是community/browser_automation/session.py里的异常类。

它继承RuntimeError。

它在browser session容量已满且没有可淘汰的槽位时抛出。

这个文档覆盖BrowserSessionCapacityError加BrowserLiveViewerError。两个session级错误。

位于backend/packages/harness/deerflow/community/browser_automation/session.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、BrowserSessionCapacityError

它继承RuntimeError。

browser session cap没有可淘汰槽位时抛出。

### 2、BrowserLiveViewerError

它继承RuntimeError。

第二个Live viewer试图附着到一个session时抛出。

一个session只允许一个Live viewer。

### 3、多worker兼容性

browser_multi_worker_error检查GATEWAY_WORKERS。

worker大于1时返回错误。browser session是进程本地的。uvicorn不提供thread亲和性。

ensure_browser_worker_compatibility在运行时browser使用时拒绝。

### 4、redact_browser_url

它丢弃query和fragment。

被拦截URL的日志行不能泄漏token和PII。

不可解析时返回<unparsable-url>。

## 三、它和谁协作

- BrowserSessionManager管理session容量。
- BrowserSession是session本体。
- Live viewer附着检查用BrowserLiveViewerError。

## 四、重要性评级

评级是4分。

理由如下。

这两个类是browser session边界的错误信号。

容量满和viewer冲突都收敛到明确错误。

多worker拒绝在启动时给出修复方向。设置GATEWAY_WORKERS=1或禁用工具。

redact_browser_url防止日志泄漏token。

扣掉6分。

扣分原因是它们是单行异常类。
