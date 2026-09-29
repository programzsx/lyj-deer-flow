# app.gateway.browser_capability-档案

源码路径是backend/app/gateway/browser_capability.py。

## 一、这个模块是干什么的

browser_capability.py是浏览器能力的共享检查。

DeerFlow的智能体可以控制浏览器。

浏览器能力要先配置。

这个模块检查能力是否配置、是否可用。

多个Gateway界面共用这套检查。

这个模块只有72行。

## 二、模块里的主要成员

### 1、BrowserCapability

BrowserCapability是检查结果。

结果包含configured、available、reason。

configured表示是否配置了浏览器能力。

available表示运行时是否可用。

reason是不可用原因。

### 2、检查逻辑

检查读取AppConfig的浏览器配置。

检查worker数量。

多worker错误来自browser_multi_worker_error。

ensure_browser_runtime_available确保运行时可用。

不可用时给出明确原因。

## 三、它和谁协作

上游是routers/browser.py和routers/features.py。

这些路由调用共享检查。

下游是deerflow.community.browser_automation的会话模块。

配置来自AppConfig。

## 重要性评级

评级是4分。

理由如下。

能力检查给浏览器功能一个统一入口。

检查结果带明确原因，方便排错。

features端点报告这个能力。

浏览器路由依赖这个检查。

但浏览器功能本身是可选的。

模块体量很小，只有检查逻辑。

不做任何业务决策。

所以评级是4分。
