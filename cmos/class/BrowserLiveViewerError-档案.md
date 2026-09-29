# BrowserLiveViewerError-档案

## 一、这个类是干什么的

BrowserLiveViewerError是community/browser_automation/session.py里的异常类。

它继承RuntimeError。

它在第二个Live viewer试图附着到一个session时抛出。

这个类位于backend/packages/harness/deerflow/community/browser_automation/session.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、继承关系

BrowserLiveViewerError继承RuntimeError。

### 2、语义

一个session只允许一个Live viewer。

第二个viewer附着时抛它。

### 3、和BrowserSessionCapacityError的关系

两者都是session级错误。

容量错误是session cap满了。

viewer错误是单个session的viewer冲突。

## 三、它和谁协作

- BrowserSession或BrowserSessionManager的Live附着检查抛它。
- Live viewer WebSocket路径捕获它。

## 四、重要性评级

评级是3分。

理由如下。

这个类是Live viewer冲突的信号。

单viewer约束明确。

单行异常类。

扣掉7分。

扣分原因是它是单行异常类。无字段。
