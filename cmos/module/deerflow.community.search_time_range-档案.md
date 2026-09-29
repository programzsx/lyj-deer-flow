# 模块档案：deerflow.community.search_time_range

## 一、这个模块是干什么的

这个模块很小。
这个模块只定义一个类型别名和两张映射表。
这个模块解决一个统一问题。
这个问题是时间范围参数的统一表达。
各个搜索引擎提供商的时间范围参数写法不一样。
例如DuckDuckGo用字母d、w、m、y。
例如Brave用pd、pw、pm、py。
DeerFlow希望给模型一个统一的参数。
这个统一参数是time_range。
time_range的取值是day、week、month、year。
各个提供商的工具负责把这个统一参数翻译成自己的写法。
翻译用的对照关系就放在这里。

## 二、模块里的主要成员

（1）SearchTimeRange
这是一个类型别名。
底层用Literal["day", "week", "month", "year"]表达。
这是所有支持时间范围的搜索工具共用的契约。

（2）DDGS_TIMELIMIT_BY_TIME_RANGE
这是一张字典。
这张字典把day、week、month、year翻译成DuckDuckGo的d、w、m、y。
ddg_search工具使用这张字典。

（3）BRAVE_FRESHNESS_BY_TIME_RANGE
这也是一张字典。
这张字典把统一取值翻译成Brave的pd、pw、pm、py。
brave工具使用这张字典。

## 三、它和谁协作

这个模块依赖谁。
这个模块只依赖标准库typing。
这个模块不依赖任何第三方库。

谁调用这个模块。
ddg_search工具导入DDGS_TIMELIMIT_BY_TIME_RANGE。
brave工具导入BRAVE_FRESHNESS_BY_TIME_RANGE。
tavily、searxng、sofya导入SearchTimeRange类型。
这几个提供商直接透传统一取值。
不需要翻译。
但它们需要这个类型声明。
模块的docstring说明了定位。
这个模块是"受支持的内置搜索提供商共享的相对时间范围契约"。

## 四、重要性评级

评级：5分。
理由：这个模块本身只有20行。但是它是多个搜索提供商共享的公共契约。修改这里会同时影响DDG、Brave、Tavily、SearXNG、Sofya五家提供商的时间过滤行为。它是典型的"小而关键"的契约模块。它没有复杂逻辑，出问题概率低。所以给中间偏低的5分。
