# deerflow.community.serply 档案

## 一、这个模块是干什么的

这个包是Serply搜索的社区工具包。

Serply是一个搜索API服务。

它提供结构化的搜索结果。

这个包导出一个工具。

工具是`web_search_tool`。

web_search_tool让智能体能搜网页。

这个包是智能体联网搜索能力的来源之一。

## 二、模块里的主要成员

### 1、web_search_tool

这个工具是网页搜索工具。

LangChain风格的StructuredTool。

智能体在对话里调用它。

工具调用Serply的API。

返回标准化的搜索结果列表。

每条结果带标题、URL、摘要。

支持可选的`time_range`参数。

time_range的取值是day、week、month、year。

## 三、它和谁协作

### 1、它依赖谁

它依赖包内的`tools.py`实现。

它依赖Serply的API。

API key从配置或环境变量读取。

### 2、谁调用它

配置系统按工具配置选择这个后端。

智能体工厂把工具装进工具集。

模型在对话中通过工具调用触发搜索。

## 四、重要性评级

### 1、评级

3分。

### 2、理由

这个包是搜索工具生态里较小众的一个选项。

DeerFlow支持多个搜索引擎。

Serply不如Brave和Tavily常用。

选了它的部署依赖它。

它是纯API封装。

逻辑最简单。

只有一个工具。

没有复杂的状态。

它是可选的。

可替换的。

不选时系统照常工作。

所以评3分。
