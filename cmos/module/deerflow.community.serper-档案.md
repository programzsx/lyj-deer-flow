# deerflow.community.serper 档案

## 一、这个模块是干什么的

这个包是Serper搜索的社区工具包。

Serper是一个Google搜索API服务。

它提供结构化的Google搜索结果。

这个包导出两个工具。

工具是`image_search_tool`和`web_search_tool`。

web_search_tool让智能体能搜网页。

image_search_tool让智能体能搜图片。

这个包是智能体联网搜索能力的来源之一。

Serper的特点是结果质量接近Google原生。

## 二、模块里的主要成员

### 1、web_search_tool

这个工具是网页搜索工具。

智能体在对话里调用它。

工具调用Serper的API。

返回标准化的搜索结果列表。

支持可选的`time_range`参数。

time_range的取值是day、week、month、year。

### 2、image_search_tool

这个工具是图片搜索工具。

智能体调用它搜图片。

走Serper的图片搜索接口。

返回图片结果列表。

## 三、它和谁协作

### 1、它依赖谁

它依赖包内的`tools.py`实现。

它依赖Serper的API。

API key从配置或环境变量读取。

### 2、谁调用它

配置系统按工具配置选择这个后端。

智能体工厂把工具装进工具集。

模型在对话中通过工具调用触发搜索。

## 四、重要性评级

### 1、评级

4分。

### 2、理由

这个包是搜索工具生态的一个选项。

Serper的搜索质量高。

结果接近Google原生。

同时提供网页和图片两个搜索。

选了它的部署依赖它。

它是纯API封装。

逻辑简单。

需要付费API key。

它是可替换的。

不选时用DDG、Brave等其他引擎。

所以评4分。
