# deerflow.community.sofya 档案

## 一、这个模块是干什么的

这个包是Sofya搜索的社区工具包。

Sofya是一个搜索API服务。

这个包导出两个工具。

工具是`web_fetch_tool`和`web_search_tool`。

web_search_tool让智能体能搜网页。

web_fetch_tool让智能体能读取网页。

这个包是智能体联网能力的来源之一。

搜索和抓取都覆盖。

## 二、模块里的主要成员

### 1、web_search_tool

这个工具是网页搜索工具。

智能体在对话里调用它。

工具调用Sofya的API。

返回标准化的搜索结果列表。

支持可选的`time_range`参数。

time_range的取值是day、week、month、year。

Sofya原样传递这些值。

映射为freshness参数。

### 2、web_fetch_tool

这个工具抓取一个URL的内容。

调用Sofya的抓取接口。

返回页面的文本内容。

## 三、它和谁协作

### 1、它依赖谁

它依赖包内的`tools.py`实现。

它依赖Sofya的API。

API key从配置或环境变量读取。

### 2、谁调用它

配置系统按工具配置选择这个后端。

智能体工厂把工具装进工具集。

模型在对话中通过工具调用触发。

## 四、重要性评级

### 1、评级

4分。

### 2、理由

这个包是搜索和抓取生态的一个选项。

它的特点是搜索和抓取都覆盖。

一个服务两个工具。

选了它的部署依赖它。

它是纯API封装。

逻辑简单。

需要API key。

它是可选的。

可替换的。

不选时用其他搜索和抓取后端。

所以评4分。
