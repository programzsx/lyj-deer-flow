# SkillCatalog档案

源码位置：backend/packages/harness/deerflow/skills/catalog.py

## 一、这个类是干什么的

SkillCatalog是技能的不可变目录。

技能系统用延迟发现。系统提示词里只放技能名。模型需要细节时调用describe_skill工具。describe_skill查询SkillCatalog。

SkillCatalog是frozen dataclass。SkillCatalog只做检索。SkillCatalog不做变更。

## 二、类的成员

（一）字段

- skills：技能元组。目录里全部的Skill。

（二）缓存属性

- names：全部技能名。frozenset。缓存后只算一次。
- _search_index：检索索引。每个技能一条_SearchEntry。归一化只做一次。按目录顺序排列。

（三）方法

- search：按查询检索技能。查询有三种形式。select:开头是按名精确选择，无结果数上限。+开头是要求名字包含指定词，其余词排序。普通文本是多词意图检索，最多返回5条。

## 三、它和谁协作

（一）检索入口

describe.py的describe_skill工具闭包持有SkillCatalog。工具调用search返回匹配的技能元数据。

（二）条目结构

_SearchEntry是索引的一行。_SearchEntry装着Skill加归一化后的名字和描述。归一化做NFKC、大小写折叠、分隔符转空格。

（三）排序

_rank_by_intent给每个条目打分。评分按五元组排序。名字完全等于查询排最前。Python排序是稳定的。同分的技能保持目录顺序。

## 四、重要性评级

评级：7分。

理由：SkillCatalog是技能延迟发现的核心。它让系统提示词保持轻量。三种查询形式覆盖精确、前缀、意图三种需求。索引归一化只算一次。它是纯检索结构，无副作用。给7分。
