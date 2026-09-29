# deerflow.community.crawl4ai 档案

## 一、这个模块是干什么的

这个包是Crawl4AI的社区工具包。

Crawl4AI是一个开源的AI友好爬虫框架。

这个包导出两个成员。

成员是`Crawl4AiClient`和`web_fetch_tool`。

`Crawl4AiClient`是Crawl4AI服务的客户端。

`web_fetch_tool`是网页抓取工具。

智能体用它抓取一个URL的内容。

Crawl4AI的特点是专为AI设计。

抓取结果输出干净的markdown。

适合直接喂给模型。

这个包是智能体联网读取网页能力的来源之一。

可以连自托管的Crawl4AI服务。

也可以连公开的Crawl4AI实例。

## 二、模块里的主要成员

### 1、Crawl4AiClient类

这个类是Crawl4AI服务的客户端。

封装对Crawl4AI API的调用。

管理连接和超时。

### 2、web_fetch_tool

这个工具抓取一个URL。

调用Crawl4AI服务。

返回AI友好的markdown内容。

智能体拿到的是结构干净的正文。

不是原始HTML。

## 三、它和谁协作

### 1、它依赖谁

它依赖包内的`crawl4ai_client.py`和`tools.py`。

它依赖Crawl4AI服务。

服务地址从配置读取。

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

Crawl4AI的特点是AI友好的markdown输出。

自托管能力是它的优势。

数据不出内网。

选了它的用户依赖它。

它是纯API封装。

逻辑不复杂。

它是可替换的。

不选时用其他抓取后端。

所以评4分。
