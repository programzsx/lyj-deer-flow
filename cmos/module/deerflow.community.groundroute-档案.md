# deerflow.community.groundroute 档案

## 一、这个模块是干什么的

这个包是GroundRoute的社区搜索和抓取工具。

GroundRoute是一个元搜索层。

它在六个搜索引擎前面放一个API。

六个引擎是Serper、Brave、Exa、Tavily、Firecrawl、Perplexity。

GroundRoute把每个查询路由到最便宜的能过质量线的引擎。

重复查询有缓存。

高强度的研究运行在一个引擎挂掉时也能继续工作。

成本不高于直连单个引擎。

定价是收益分成。

调用方保留约一半的缓存节省。

这个包导出两个工具。

工具是`web_fetch_tool`和`web_search_tool`。

## 二、模块里的主要成员

### 1、web_search_tool

这个工具做网页搜索。

返回标准化的JSON列表。

每条结果带标题、URL、摘要、来源引擎。

### 2、web_fetch_tool

这个工具读取一个URL。

走GroundRoute的mode=page。

返回提取出的文本。

### 3、实现特点

这个模块是自包含的。

只依赖httpx。

没有GroundRoute SDK。

`/v1/search`的请求和响应映射对齐GroundRoute的MCP服务器和验证过的Langflow组件。

## 三、它和谁协作

### 1、它依赖谁

它依赖httpx。

它依赖GroundRoute的API。

API key从环境变量读取。

### 2、谁调用它

配置系统按工具配置选择这个后端。

智能体工厂把工具装进工具集。

模型在对话中通过工具调用触发。

## 四、重要性评级

### 1、评级

4分。

### 2、理由

这个包是搜索工具生态的又一个选项。

它的独特价值是多引擎路由。

一个引擎挂掉时查询自动切到别的引擎。

重复查询有缓存。

成本更低。

这是单引擎API做不到的。

选了它的部署依赖它。

它是纯API封装。

只依赖httpx。

自包含。

它是可选的。

搜索生态里可替换。

所以评4分。
