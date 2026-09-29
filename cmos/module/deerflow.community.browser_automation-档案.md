# deerflow.community.browser_automation 档案

## 一、这个模块是干什么的

这个包是浏览器自动化的社区工具包。

这个包让智能体能操控一个真实的浏览器。

智能体可以打开网页、点击、输入、截图、读取内容。

浏览器会话由会话管理器管理。

会话有容量限制。

这个包导出两组成员。

一组是会话管理层。

一组是工具层。

工具层包括导航、点击、输入、截图、快照、读取文本、关闭、后退。

会话管理器是单例的。

按进程管理浏览器实例。

## 二、模块里的主要成员

### 1、会话管理层

`BrowserSessionManager`是会话管理器。

管理浏览器实例的生命周期。

`get_browser_session_manager`获取单例。

`reset_browser_session_manager`重置单例。

测试用。

`BrowserSession`代表一个浏览器会话。

`BrowserTab`代表一个标签页。

`PageSnapshot`是页面快照。

`SnapshotElement`是快照里的元素。

快照让智能体看到页面的可交互元素。

`BrowserSessionCapacityError`是容量错误。

会话数超限时抛出。

`BrowserLiveViewerError`是实时查看器错误。

`browser_multi_worker_error`是多worker错误。

浏览器会话不能跨worker共享。

`redact_browser_url`给URL脱敏。

日志和错误信息里的URL可能带敏感参数。

### 2、工具层

`browser_navigate_tool`导航到URL。

`navigate_and_capture`导航并捕获。

`browser_click_tool`点击元素。

`browser_type_tool`输入文本。

`browser_screenshot_tool`截图。

这个工具创建用户请求的artifact。

输出是PNG。

`browser_snapshot_tool`获取页面快照。

快照带可交互元素。

`browser_get_text_tool`读取页面文本。

`browser_back_tool`后退。

`browser_close_tool`关闭。

`validate_browser_url`校验URL。

防止智能体导航到危险地址。

### 3、进度截图

隐藏的每动作浏览器进度帧用JPEG。

质量是80。

JPEG保持存储和传输成本有界。

无损PNG更大。

`browser_screenshot`工具仍然是PNG。

这个工具创建用户请求的artifact。

新的自动捕获入口必须复用tools.py里的共享进度编码定义。

字节编码和`.jpg`后缀不能漂移。

## 三、它和谁协作

### 1、它依赖谁

它依赖浏览器自动化运行时。

它依赖`deerflow.config`读取配置。

### 2、谁调用它

智能体工厂把浏览器工具装进智能体工具集。

harness的受保护浏览器功能用这个包。

配置了浏览器能力的智能体可以调用这些工具。

会话管理器被worker共享。

## 四、重要性评级

### 1、评级

6分。

### 2、理由

这个包是智能体浏览器能力的基础。

有些网站没有API。

智能体只能通过真实浏览器操作。

没有这个包。

智能体对这类网站无能为力。

它的设计覆盖了几个关键点。

会话容量限制防止资源耗尽。

多worker错误防止跨进程共享会话。

URL校验和脱敏处理安全面。

进度帧的JPEG编码控制成本。

它是可选能力。

需要配置才启用。

普通对话不经过它。

逻辑量中等。

会话管理部分复杂。

所以评6分。
