# _SearchEntry档案

源码位置：backend/packages/harness/deerflow/skills/catalog.py

## 一、这个类是干什么的

_SearchEntry是技能检索索引的一行。

检索每次都要归一化技能名和描述。归一化有成本。_SearchEntry把归一化结果缓存下来。每个技能只归一化一次。

_SearchEntry是frozen dataclass。_SearchEntry由SkillCatalog的_search_index缓存属性构造。

## 二、类的成员

（一）字段

- skill：原始的Skill对象。
- normalized_name：归一化后的技能名。
- normalized_description：归一化后的技能描述。

归一化的处理是固定的。先做NFKC。再做大小写折叠。再把名字分隔符（连字符、下划线、点、斜杠）换成空格。最后压缩空白。

## 三、它和谁协作

（一）构造者

SkillCatalog的_search_index缓存属性构造全部条目。条目按目录顺序排列。

（二）消费者

_intent_score按条目打分。打分时直接读归一化后的名字和描述。_contains_term在归一化文本里找词。

## 四、重要性评级

评级：3分。

理由：_SearchEntry只是检索索引的缓存行。它让归一化只做一次。没有它每次检索都要重复归一化。它是三字段的frozen dataclass。给3分。
