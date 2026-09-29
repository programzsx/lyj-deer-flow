# serply-web-search-档案

## 一、这个类是干什么的

serply模块不是单个类。

它是community/serply/目录下的工具模块。

它是Serply API驱动的web搜索工具。

Serply以JSON返回live Google结果。

一个API key覆盖常规web SERP加Google News和Google Scholar垂直。

research run可以在config.yaml切换vertical。

指向近期报道或论文。

需要API key。

这个模块位于backend/packages/harness/deerflow/community/serply/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、web_search_tool

web_search按query搜索。

用Google Search via Serply。

max_results默认5。上限100。

query规整。上限500字符。

### 2、vertical支持

_VERTICALS映射vertical到URL路径段和响应键。

search映射search和results。

news映射news和entries。

scholar映射scholar和articles。

无效vertical警告并回退search。

### 3、_normalize_row

它把一个Serply行映射到公共title、url、content形状。

news行有额外字段。

content是HTML清理后的summary。published、source。

scholar行有authors、cited_by、pdf_url。

_news的HTML用html.unescape加TAG_RE剥离。

### 4、_serply_get

GET到Serply端点。

X-Api-Key头。

返回(data, error_json)元组。

超时30秒。

### 5、key和其他

key从配置或SERPLY_API_KEY环境变量。

_coerce_max_results规整。

无效警告用默认。

key警告每工具一次。

## 三、它和谁协作

- Serply API是搜索后端。
- get_app_config提供工具配置。
- web_fetch工具配合搜索结果。

## 四、重要性评级

评级是3分。

理由如下。

这个模块是Serply搜索集成的实现。

三个vertical覆盖web、news、scholar。

news的HTML清理。

scholar的作者和引用字段。

这些细节不错。

扣掉7分。

扣分原因是它是可选搜索集成。
