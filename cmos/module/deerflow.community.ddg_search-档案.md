# deerflow.community.ddg_search 档案

## 一、这个模块是干什么的

这个包是DuckDuckGo搜索的社区工具包。

这个包导出一个工具。

工具是`web_search_tool`。

web_search_tool让智能体能搜网页。

DuckDuckGo的特点是不需要API key。

这是DeerFlow的默认搜索后端之一。

新用户不配任何密钥也能联网搜索。

这个包是智能体联网搜索能力的来源之一。

## 二、模块里的主要成员

### 1、web_search_tool

这个工具是网页搜索工具。

LangChain风格的StructuredTool。

智能体在对话里调用它。

底层用DDGS库。

DDGS是DuckDuckGo的Python搜索库。

工具支持可选的`time_range`参数。

time_range的取值是day、week、month、year。

DDG的映射是d、w、m、y。

省略时保持请求原样。

DDGS库有版本注意事项。

DDGS 9.14.1对time_range只使用支持timelimit的引擎。

支持的引擎是启用的Brave、DuckDuckGo、Yahoo。

auto和all解析成这个集合。

不兼容的配置引擎会被移除。

空集合回退到这个集合。

升级DDGS时需要重新检查。

## 三、它和谁协作

### 1、它依赖谁

它依赖包内的`tools.py`实现。

它依赖DDGS库。

DuckDuckGo不需要API key。

### 2、谁调用它

配置系统按工具配置选择这个后端。

智能体工厂把工具装进工具集。

模型在对话中通过工具调用触发搜索。

## 四、重要性评级

### 1、评级

5分。

### 2、理由

这个包是搜索工具的默认选项之一。

它的独特价值是不需要API key。

新用户开箱即可联网搜索。

这是其他付费引擎做不到的。

选它做默认引擎的部署依赖它。

它是纯API封装。

逻辑简单。

DDGS库的行为有版本依赖。

time_range的引擎过滤逻辑需要注意升级。

对没有其他搜索密钥的部署。

这个包是唯一的联网搜索来源。

对配置了多个引擎的部署。

它是可替换的。

所以评5分。
