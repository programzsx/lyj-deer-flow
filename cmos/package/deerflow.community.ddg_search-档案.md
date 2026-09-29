# deerflow.community.ddg_search档案

本文档介绍DeerFlow社区工具包`deerflow.community.ddg_search`。

本文档基于对`backend/packages/harness/deerflow/community/ddg_search/`目录下全部代码的实际阅读。

本文档的读者是想理解这个包代码的开发者。

包目录下有两个代码文件。

一个是`__init__.py`。

一个是`tools.py`。

## 一、这个包是干什么的

这是DuckDuckGo搜索的工具集成。

这个包通过DDGS聚合库调用DuckDuckGo搜索。

这个包最大的特点是不需要API密钥。

用户不需要注册任何账号。装好`ddgs`库就能用。

这个包只给AI代理提供一个工具。

这个工具是`web_search_tool`。这个工具搜索网页。

这个包支持多后端搜索。

DDGS库本身聚合了多个搜索引擎。后端包括duckduckgo、brave、yahoo等。

后端可以配置成auto。auto表示自动选择。

这个包还支持维基百科搜索。

## 二、包里的主要成员

### 1、`__init__.py`

这个文件只有3行代码。

这个文件导出一个工具。

导出的工具是`web_search_tool`。

### 2、`web_search_tool`

这是一个LangChain工具。装饰器是`@tool("web_search")`。

这个工具用DuckDuckGo搜索网页。

这个工具的用途是找当前信息、新闻、文章和网络事实。

这个工具有3个参数。

第一个参数是`query`。这个参数是搜索关键词。

第二个参数是`max_results`。这个参数是最大结果数。默认值是5。

第三个参数是`time_range`。这个参数是可选的时间范围。时间范围支持day、week、month、year。

这个工具先从配置读默认值。

配置里能覆盖4个设置。

这4个设置是max_results、region、safesearch、backend。

然后调用内部函数`_search_text`执行搜索。

搜索结果被规范化成title、url、content三个字段。最后输出JSON。

### 3、`_search_text`

这是内部搜索执行函数。

这个函数先尝试导入`ddgs`库。

`ddgs`库没装就记日志错误并返回空列表。

导入成功后创建`DDGS(timeout=30)`实例。

然后设置搜索参数并发起搜索。

如果传了`time_range`，后端会先经过时间范围过滤。

### 4、时间范围支持

这个包支持相对时间范围。

时间范围类型来自`deerflow.community.search_time_range`。

映射关系存在`DDGS_TIMELIMIT_BY_TIME_RANGE`里。

day映射成d。week映射成w。month映射成m。year映射成y。

时间范围能力有后端限制。

`TIME_RANGE_CAPABLE_BACKENDS`列出了支持timelimit的后端。

DDGS 9.14.1版本里支持的后端是brave、duckduckgo、yahoo。

`_resolve_time_range_backend(backend)`负责过滤后端。

配置成auto或all时解析成支持时间范围的默认后端集合。

配置了不支持时间范围的后端时记警告并剔除。

剔除后为空就回退到默认集合。

这条规则的原因是部分DDGS后端会忽略timelimit参数。

Google和Bing实现了timelimit。但DDGS 9.14.1里这两个后端被上游禁用了。

DDGS升级后需要重新检查这条规则。

### 5、维基百科区域处理

这个包对维基百科后端做了区域适配。

DDGS的wikipedia引擎把region的第二段当作维基百科子域名。

默认全球区域wt-wt会变成wt.wikipedia.org。这个子域名不存在。

`_infer_wikipedia_region(query)`负责根据查询语言推断区域。

推断按Unicode码点范围判断。

日语假名(0x3040-0x31FF)推断为jp-ja。

韩文(0xAC00-0xD7AF等)推断为kr-ko。

汉字(0x3400-0x9FFF)推断为cn-zh。

西里尔字母推断为ru-ru。

希腊字母推断为gr-el。

希伯来字母推断为il-he。

阿拉伯字母推断为xa-ar。

其他情况用默认区域us-en。

`WIKIPEDIA_LANGUAGE_ALIASES`还做了语言别名映射。

jp映射成ja。kr映射成ko。tzh映射成zh。wt映射成en。

### 6、参数规范化辅助函数

`_coerce_max_results(value)`负责规范化结果数。

布尔值和小数被直接判为非法。

布尔值会被int()接受。YAML小数如3.5会被静默截断。这两种情况都要挡住。

非法输入用默认值5。合法输入返回正整数。

`_normalize_backend(backend)`负责规范化后端参数。

后端可以是None、字符串、列表或元组。

列表和元组会被逗号拼接成字符串。

空值回退到默认值auto。

`_normalize_setting(value, default)`负责规范化普通字符串设置。

空值用默认值。

## 三、它和谁协作

### 1、依赖的外部服务

这个包依赖DuckDuckGo和其他被DDGS聚合的搜索引擎。

搜索请求通过DDGS库发出。

这个包不直接管理API密钥。因为DuckDuckGo搜索不需要密钥。

### 2、依赖的内部模块

这个包依赖`deerflow.community.search_time_range`。

这个包依赖`deerflow.config.get_app_config`。

这个包依赖第三方库langchain。

这个包延迟导入第三方库ddgs。

### 3、被谁调用

这个工具注册名是`web_search`。

DeerFlow的代理工具装配层按配置选择搜索提供方。

配置选择ddg时这个工具会被加进代理工具集。

AI代理在运行时直接调用这个工具。

这个包是零配置的搜索后端。新用户没有配置任何搜索密钥时。这个包往往是默认可用的搜索工具。

## 四、重要性评级

评级：4分。

理由如下。

这个包是社区贡献的可选搜索提供方。

DeerFlow有多个搜索后端可以互相替代。

所以这个包不是必需组件。

但是这个包有独特的价值。

这个包是唯一不需要API密钥的搜索集成。

零密钥意味着开箱即用。这对新用户部署很友好。

这个包的维基百科区域推断逻辑比较精巧。按Unicode码点自动选区域。

这个包的时间范围后端过滤逻辑体现了对DDGS库行为细节的了解。

综合来看。这个包是可替代但有独特价值的可选组件。评级4分。
