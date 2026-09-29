# deerflow.community.browserless 档案

## 一、这个模块是干什么的

这个包是Browserless的社区工具包。

Browserless是一个托管的浏览器服务。

它提供云端的headless浏览器。

这个包导出三个成员。

成员是`BrowserlessClient`、`web_capture_tool`、`web_fetch_tool`。

`BrowserlessClient`是API客户端。

封装对Browserless服务的调用。

`web_fetch_tool`是网页抓取工具。

智能体用它抓取一个URL的文本内容。

`web_capture_tool`是网页捕获工具。

智能体用它捕获网页的渲染结果。

这个包是智能体联网读取网页能力的来源之一。

DeerFlow支持多种抓取后端。

Browserless是其中之一。

## 二、模块里的主要成员

### 1、BrowserlessClient类

这个类是Browserless服务的客户端。

封装HTTP调用。

管理API连接。

### 2、web_fetch_tool

这个工具抓取一个URL。

返回页面的文本内容。

内容经过可读性处理。

智能体能拿到干净的正文。

### 3、web_capture_tool

这个工具捕获网页。

利用Browserless的渲染能力。

适合JavaScript渲染的页面。

纯HTTP抓取拿不到JS渲染的内容。

这个工具可以。

## 三、它和谁协作

### 1、它依赖谁

它依赖包内的`browserless_client.py`和`tools.py`。

它依赖Browserless服务。

这需要API key。

### 2、谁调用它

配置系统按工具配置选择这个后端。

智能体工厂把工具装进工具集。

模型在对话中通过工具调用触发抓取。

## 四、重要性评级

### 1、评级

4分。

### 2、理由

这个包是网页抓取生态的一个选项。

DeerFlow的网页读取有多个后端。

Jina、Browserless、Crawl4AI、GroundRoute、Unbrowse。

Browserless是其中之一。

它的特点是云端渲染。

JS重的页面靠它。

选了它的用户依赖它。

它是纯API封装。

逻辑不复杂。

需要外部服务。

不配置时不可用。

它是可替换的。

所以评4分。
