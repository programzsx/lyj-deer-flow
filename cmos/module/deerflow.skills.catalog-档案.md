# deerflow.skills.catalog-档案

## 一、这个模块是干什么的

这个模块实现延迟技能发现。

默认模式下。系统提示里列出全部技能的完整元数据。技能多的时候提示很长。前缀缓存也不友好。

延迟发现模式下。系统提示里只列技能名字。放在<skill_index>块里。模型想了解某个技能时。调用describe_skill工具获取完整元数据。

这样做的好处有两个。系统提示保持紧凑。前缀缓存保持友好。同时模型仍然可以自主发现技能。

这个模块提供SkillCatalog。目录是一个不可变集合。目录支持三种查询形式。目录只做搜索。不做修改。

## 二、模块里的主要成员

### 1、限制常量

MAX_RESULTS是5。普通查询最多返回5个技能。

MAX_QUERY_CHARS是256。查询最多256个字符。

MAX_QUERY_TERMS是16。最多提取16个唯一意图词。

### 2、规范化助手

_NAME_SEPARATOR_RE把名字里的连字符、下划线、点、斜杠替换成空格。

_TOKEN_RE提取词元。匹配非下划线的连续文字字符。

_WHITESPACE_RE压缩空白。

_IGNORED_SINGLE_ASCII_TERMS是{"a", "i"}。英文冠词和代词几乎匹配所有条目。所以丢弃。其他单字符词保留。因为C++和R这样的技能名里单字符有意义。

_normalize_search_text函数做完整规范化。先NFKC Unicode规范化。再casefold小写化。再替换名字分隔符。再压缩空白。

### 3、_query_terms函数

这个函数提取有界的唯一意图词。

函数截断查询到256字符。逐个提取词元。跳过"a"和"i"。跳过重复。攒够16个就停。返回元组。

### 4、_contains_term函数

这个函数判断文本是否包含某个词。

单字符ASCII词按词元匹配。用_TOKEN_RE切成词再比较。这样"C"只在独立词出现时命中。不会误匹配别的词里的字母。

其他词用普通子串匹配。

### 5、_intent_score函数

这个函数给一个技能打意图分。

函数分别检查名字和描述对每个词的命中。计算名字命中数和总匹配词数。

一个词都没匹配返回None。表示这个技能与查询无关。

分数是一个五元组。按优先级从高到低排。

第一优先。名字完全等于规范化查询。

第二优先。匹配词数。也就是名字或描述命中的词总数。

第三优先。查询整体是名字的子串。

第四优先。名字命中数。

第五优先。查询整体出现在描述里。

### 6、_rank_by_intent函数

这个函数按意图排序。

函数给每个条目打分。打不出分的进unmatched列表。

Python排序是稳定的。同分的技能保持目录顺序。

include_unmatched为True时。未命中的排在命中结果后面。

最后截取前MAX_RESULTS个。

### 7、SkillCatalog类

这是核心类。frozen dataclass。只有一个字段skills元组。

类上有一条重要注释。frozen=True不能加slots=True。cached_property要把结果写进实例的__dict__。这会绕过frozen的__setattr__。加了slots就没有__dict__了。哈希和名字都会在运行时坏。这条注释防止后人好心加slots。

有三个cached_property。

names返回全部技能名的frozenset。

_search_index返回规范化的搜索索引元组。每个目录只算一次规范化。

search方法处理三种查询形式。

select:开头是精确选择。按逗号拆名字。返回全部精确匹配。select:解析在长度和数量限制之前。所以select:没有查询长度和结果数量上限。

+开头是必含前缀搜索。第一个token必须在名字里。后面可以跟排序词。排序词在候选里排意图序。include_unmatched为True。光有加号没有token返回空列表。

其他是自由文本意图搜索。直接调_rank_by_intent。不带unmatched。

与工具搜索的差别是。技能排名用字面意图词。工具搜索用自由文本正则匹配。

## 三、它和谁协作

describe模块是它的直接消费者。build_skill_search_setup构造目录。describe_skill工具的闭包持有目录。工具收到查询就调catalog.search。

agent工厂和嵌入式客户端都通过describe间接使用它。

它依赖types模块的Skill。

## 四、重要性评级

评级是7分（满分10分）。

理由：

延迟发现是控制提示体积和缓存命中的关键特性。catalog是这个特性的搜索核心。

它的查询语义有三层。精确选择、必含前缀、自由文本。意图打分的多级元组设计让名字命中优于描述命中。同分保持目录顺序。排序是稳定的。

frozen加cached_property的坑有注释钉住。避免后人加slots弄坏运行时。这种防御性注释值得肯定。

但它属于可选路径。配置skills.deferred_discovery默认是False。默认模式下这个模块不参与。所以给7分。
