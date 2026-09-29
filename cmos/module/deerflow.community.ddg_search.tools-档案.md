# 模块档案：deerflow.community.ddg_search.tools

## 一、这个模块是干什么的

这个模块定义一个Agent工具。
工具名是web_search。
它用DuckDuckGo搜索网页。
它不需要API key。
这是它最大的特点。
其他搜索提供商都要用户注册key。
这个模块通过DDGS库调用。
DDGS是一个聚合多家搜索引擎的Python库。
它支持指定后端。
比如duckduckgo、brave、yahoo。
这个模块暴露web_search工具。
还处理DDGS库的两个特殊行为。
第一个特殊行为是时间范围。
不是所有DDGS后端都支持timelimit参数。
第二个特殊行为是Wikipedia区域。
DDGS的wikipedia引擎把region的第二段当作Wikipedia子域名。

## 二、模块里的主要成员

（1）web_search_tool
这是Agent工具。
参数有query、max_results、time_range。
max_results默认5。
time_range是可选的相对时间窗口。
翻译用search_time_range模块的对照表。
翻译成d、w、m、y。
配置可以从config.yaml覆盖默认值。
覆盖项有max_results、region、safesearch、backend。

（2）时间范围后端过滤
_resolve_time_range_backend排除不支持timelimit的DDGS后端。
ddgs 9.14.1里启用的文本引擎只有三个实现了timelimit。
这三个是brave、duckduckgo、yahoo。
Google和Bing也实现了，但上游在这个版本里禁用了它们。
配置auto或all时解析成这三个后端。
配置了不兼容的后端就剔除并警告。
剔完为空就回退到默认三个。
配置了time_range时才做这个过滤。
没配time_range就用正常的后端。

（3）Wikipedia区域推断
_resolve_ddgs_region解析区域。
DDGS的wikipedia引擎把region第二段当Wikipedia子域名。
默认区域wt-wt会变成wt.wikipedia.org。
这是无效的。
所以查询里包含特定文字的Unicode码点时推断区域。
日文码点推断jp-ja。
韩文码点推断kr-ko。
中文码点推断cn-zh。
西里尔码点推断ru-ru。
希腊码点推断gr-el。
希伯来码点推断il-he。
阿拉伯码点推断xa-ar。
其他情况用us-en。
还处理语言别名。
jp映射ja。
kr映射ko。
tzh映射zh。
wt映射en。

（4）_search_text内部函数
它执行实际的文本搜索。
延迟导入ddgs库。
没安装就打错误日志并返回空列表。
DDGS超时30秒。
搜索失败返回空列表。
返回结果归一化成title、url、content结构。

## 三、它和谁协作

这个模块依赖谁。
依赖ddgs库。
ddgs是可选依赖。
延迟导入。
依赖search_time_range模块的契约。
依赖deerflow.config。

谁调用这个模块。
DeerFlow的工具框架把它注册成Agent的web_search工具。
它是默认候选的搜索提供商之一。

## 四、重要性评级

评级：5分。
理由：这是少数不需要API key的搜索提供商。开箱即用。它对DDGS库的版本行为做了细致适配。时间范围后端过滤和Wikipedia区域推断都是针对真实坑的修复。仓库的AGENTS.md还专门提醒在DDGS升级时要复查这些假设。它是默认搜索选项之一。给5分。
