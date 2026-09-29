# deerflow.community.unbrowse 档案

## 一、这个模块是干什么的

这个包是Unbrowse的社区工具包。

Unbrowse是一个网页读取服务。

这个包导出一个工具。

工具是`web_fetch_tool`。

web_fetch_tool让智能体能抓取一个URL的文本内容。

这个包是智能体联网读取网页能力的来源之一。

DeerFlow支持多种抓取后端。

Unbrowse是其中之一。

## 二、模块里的主要成员

### 1、web_fetch_tool

这个工具抓取一个URL。

调用Unbrowse服务。

返回页面的文本内容。

内容经过提取处理。

智能体拿到的是可读的正文。

不是原始HTML。

## 三、它和谁协作

### 1、它依赖谁

它依赖包内的`tools.py`实现。

它依赖Unbrowse服务。

服务地址和凭据从配置读取。

### 2、谁调用它

配置系统按工具配置选择这个后端。

智能体工厂把工具装进工具集。

模型在对话中通过工具调用触发抓取。

## 四、重要性评级

### 1、评级

3分。

### 2、理由

这个包是网页抓取生态的一个选项。

DeerFlow的网页读取有多个后端。

Jina、Browserless、Crawl4AI、GroundRoute、Unbrowse。

Unbrowse是其中之一。

选了它的部署依赖它。

它是纯API封装。

只有一个工具。

逻辑最简单。

需要外部服务。

它是可替换的。

不选时用其他抓取后端。

所以评3分。
