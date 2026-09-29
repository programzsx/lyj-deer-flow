# exa-web-tools-档案

## 一、这个类是干什么的

exa模块不是单个类。

它是community/exa/目录下的工具集。

只有tools.py。

Exa是AI搜索服务。

提供web_search和web_fetch两个工具。

用exa_py SDK。

这个模块位于backend/packages/harness/deerflow/community/exa/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、web_search_tool

web_search按query搜索。

max_results默认5。

search_type默认auto。

contents_max_characters默认1000。

可从工具配置覆盖。

搜索带highlights。max_characters限制。

结果规整成title、url、snippet。

snippet是highlights的连接。

### 2、web_fetch_tool

web_fetch抓取指定URL的内容。

只fetch用户直接提供的或搜索返回的精确URL。

不能访问需要认证的内容。

text上限4096字符。

返回标题加正文。

### 3、_coerce_positive_int

它规整配置值再交给Exa SDK。

config.yaml里的$VAR引用解析成字符串。

exa-py直接拒绝字符串num_results。

否则每次搜索都失败。

只接受整数或整数形式字符串。

int()会静默截断浮点如未加引号的3.5。

把true变成1。

其他情况警告并保持默认。

### 4、_get_exa_client

它从工具配置构建Exa客户端。

api_key来自配置的model_extra。

### 5、fastcrw对照

fastcrw模块类似。

用FirecrawlApp。

web_search带limit。

web_fetch做SSRF检查。

allow_private_addresses可配置。

scrape formats为markdown。

截断4096字符。

### 6、firecrawl对照

firecrawl模块更简单。

AsyncFirecrawlApp。

web_search和web_fetch都是async。

异常都返回Error字符串。

## 三、它和谁协作

- exa_py SDK是搜索后端。
- get_app_config提供工具配置。
- web_fetch工具配合搜索结果。

## 四、重要性评级

评级是3分。

理由如下。

这个模块是Exa搜索集成的实现。

_coerce_positive_int处理了字符串配置值。

否则exa-py拒绝字符串导致搜索全失败。

web_fetch有4096字符上限。

这些细节不错。

扣掉7分。

扣分原因是它是薄SDK包装。

没有SSRF检查。逻辑简单。
