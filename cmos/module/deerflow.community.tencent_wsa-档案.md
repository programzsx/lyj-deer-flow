# deerflow.community.tencent_wsa 档案

## 一、这个模块是干什么的

这个包是腾讯云Web搜索API的社区提供者。

腾讯云的Web Search API（WSA）提供中文网页搜索能力。

这个包让智能体能用腾讯云的搜索服务。

中文搜索是它的主要场景。

国内部署访问Google系引擎不便。

腾讯云WSA是一个本土化的选择。

这个包的核心是`tools.py`里的搜索工具。

## 二、模块里的主要成员

### 1、tools.py里的web搜索工具

这是网页搜索工具。

工具用`langchain.tools`的`tool`装饰器定义。

搜索端点是`https://api.wsa.cloud.tencent.com/SearchPro`。

API key从环境变量`TENCENTCLOUD_WSA_APIKEY`读取。

默认返回5条结果。

API单次最多返回10条。

工具最多支持50条。

工具内部用httpx调用API。

配置从`get_app_config()`读取。

## 三、它和谁协作

### 1、它依赖谁

它依赖httpx发HTTP请求。

它依赖`deerflow.config`读取配置。

它依赖腾讯云WSA服务。

这需要API key。

### 2、谁调用它

配置系统按工具配置选择这个后端。

智能体工厂把工具装进工具集。

模型在对话中通过工具调用触发搜索。

## 四、重要性评级

### 1、评级

4分。

### 2、理由

这个包是搜索工具生态的本土化选项。

国内部署访问国际搜索引擎受限。

腾讯云WSA填补了这个空缺。

中文搜索质量对中文用户重要。

选了这个后端的部署依赖它。

它是纯API封装。

逻辑简单。

需要腾讯云的API key。

它是可选的。

可替换的。

不选时用其他搜索引擎。

所以评4分。
