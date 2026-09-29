# deerflow.community.brave 档案

## 一、这个模块是干什么的

这个包是Brave搜索的社区工具包。

Brave Search是Brave浏览器的搜索服务。

它提供独立的搜索API。

这个包导出两个工具。

工具是`web_search_tool`和`image_search_tool`。

web_search_tool让智能体能搜网页。

image_search_tool让智能体能搜图片。

这两个工具都接Brave的API。

API key从配置读取。

这个包是智能体联网搜索能力的来源之一。

DeerFlow支持多个搜索引擎。

Brave是其中之一。

## 二、模块里的主要成员

### 1、导出的工具

`web_search_tool`是网页搜索工具。

这是一个LangChain风格的StructuredTool。

智能体在对话里调用它。

工具内部调用Brave的搜索API。

返回标准化的搜索结果列表。

每条结果带标题、URL、摘要。

支持可选的`time_range`参数。

time_range的取值是day、week、month、year。

Brave的映射是pd、pw、pm、py。

省略时保持请求原样。

`image_search_tool`是图片搜索工具。

智能体调用它搜图片。

返回图片结果列表。

## 三、它和谁协作

### 1、它依赖谁

它依赖包内的`tools.py`实现。

它依赖Brave Search的API。

API key从配置或环境变量读取。

### 2、谁调用它

配置系统按`extensions_config.json`或配置选择工具集。

智能体工厂把工具装进智能体的工具集。

模型在对话中通过工具调用触发搜索。

## 四、重要性评级

### 1、评级

4分。

### 2、理由

这个包是搜索工具生态的一个选项。

DeerFlow的联网搜索有多个引擎。

DDG、Brave、Tavily、SearXNG、Sofya、GroundRoute。

Brave是其中之一。

选了Brave的用户依赖它。

不选时用别的引擎。

它是纯API封装。

逻辑简单。

没有复杂的状态和设计决定。

搜索能力本身对智能体很重要。

但具体到Brave这一个实现。

它是可替换的。

所以评4分。
