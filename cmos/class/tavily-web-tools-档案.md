# tavily-web-tools-档案

## 一、这个类是干什么的

tavily模块不是单个类。

它是community/tavily/目录下的工具模块。

它是Tavily搜索服务的web工具。

提供web_search和web_fetch两个工具。

用tavily的AsyncTavilyClient。

这个模块位于backend/packages/harness/deerflow/community/tavily/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、web_search_tool

web_search按query搜索。

max_results默认5。可从配置覆盖。

支持include_domains和exclude_domains。

include_domains设置时include_domains_mode为filter。

time_range是可选相对窗口。

finally里关闭客户端。

结果规整成title、url、snippet。

### 2、web_fetch_tool

web_fetch用Tavily extract抓取URL。

failed_results非空时返回第一个错误。

results非空时提取。

extract结果保证URL和content。但不保证页面标题。

标题回退到url或原始url。

raw_content截断4096字符。

### 3、_get_tavily_client

它从工具配置构建Tavily客户端。

api_key来自配置的model_extra。

### 4、客户端生命周期

每次搜索建新客户端。

finally里close。

不共享连接。

## 三、它和谁协作

- Tavily API是搜索后端。
- get_app_config提供工具配置。
- SearchTimeRange来自community/search_time_range.py。

## 四、重要性评级

评级是3分。

理由如下。

这个模块是Tavily搜索集成的实现。

include_domains_mode为filter的语义。

extract的标题回退。

finally关闭客户端。

这些细节不错。

扣掉7分。

扣分原因是它是薄SDK包装。
