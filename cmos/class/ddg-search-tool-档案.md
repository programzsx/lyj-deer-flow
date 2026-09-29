# ddg-search-tool-档案

## 一、这个类是干什么的

web_search_tool不是类。

它是community/ddg_search/tools.py里的LangChain @tool函数。

ddg_search/tools.py是用DuckDuckGo的web搜索工具。

不需要API key。

用ddgs库。

这个模块位于backend/packages/harness/deerflow/community/ddg_search/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、web_search_tool

web_search按query搜索。

max_results默认5。region默认wt-wt。

safesearch默认moderate。backend默认auto。

可从工具配置覆盖默认。

time_range是可选的相对发布窗口。

只在请求需要近期结果时用。

结果规整成title、url、content。

url取href或link。content取body或snippet。

### 2、backend处理

_normalize_backend规整backend。

可以是字符串或列表元组。

_resolve_time_range_backend排除忽略原生time limit的DDGS text backend。

TIME_RANGE_CAPABLE_BACKENDS是brave、duckduckgo、yahoo。

Google和Bing也实现了timelimit但上游在这个release里禁用了。

auto或all时用默认支持列表。

不支持的backend警告并排除。

### 3、Wikipedia区域推断

_resolve_ddgs_region处理DDGS的wikipedia引擎。

wikipedia引擎把region第二部分当Wikipedia子域。

默认worldwide区域wt-wt会变成wt.wikipedia.org。

_infer_wikipedia_region按query码点推断有效语言区域。

日文假名区推断jp-ja。

韩文区推断kr-ko。

CJK统一表意区推断cn-zh。

西里尔、希腊、希伯来、阿拉伯都有对应区域。

WIKIPEDIA_LANGUAGE_ALIASES映射jp到ja、kr到ko、tzh到zh等。

### 4、_coerce_max_results

它规整配置和参数值再传给DDGS。

布尔拒绝。非整数浮点拒绝。

int()接受布尔并静默截断YAML值如3.5。

无效值警告并使用默认。

### 5、_search_text

它执行DuckDuckGo文本搜索。

ddgs库未安装时日志并返回空。

DDGS超时30秒。

time_range映射DDGS_TIMELIMIT_BY_TIME_RANGE。

day映射d、week映射w、month映射m、year映射y。

异常时日志并返回空。

## 三、它和谁协作

- ddgs库是搜索后端。
- get_app_config提供工具配置。
- SearchTimeRange来自community/search_time_range.py。
- web_fetch工具配合搜索结果。

## 四、重要性评级

评级是4分。

理由如下。

这个模块是无API key的搜索集成。

Wikipedia区域推断处理了DDGS引擎的区域子域行为。

布尔和浮点拒绝防止静默截断。

time_range的backend过滤防止忽略timelimit的引擎。

这些细节质量不错。

扣掉6分。

扣分原因是它是可选搜索集成。

逻辑直接。
