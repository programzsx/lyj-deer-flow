# SkillSearchSetup档案

源码位置：backend/packages/harness/deerflow/skills/describe.py

## 一、这个类是干什么的

SkillSearchSetup是一次agent构建的技能检索装配结果。

agent构建时要决定怎么呈现技能。方式有两种。第一种是旧式的全量元数据提示。第二种是延迟发现加describe_skill工具。装配结果决定用哪种。

SkillSearchSetup是frozen dataclass。SkillSearchSetup镜像tool_search.py的DeferredToolSetup。

## 二、类的成员

（一）字段

- describe_skill_tool：describe_skill工具。没有技能或检索关闭时是None。
- skill_names：技能名集合。frozenset。渲染进系统提示词的skill_index段。

（二）两种形态

- 空形态：工具是None，名字集是空frozenset。agent回退到旧式全量元数据提示。
- 填充形态：工具加进agent工具集。skill_index只渲染名字。模型按需用工具查细节。

## 三、它和谁协作

（一）产生者

build_skill_search_setup函数产出SkillSearchSetup。enabled为False或技能列表为空时返回空形态。否则构造SkillCatalog并建立工具。

（二）工具

describe_skill工具闭包持有SkillCatalog。工具按select:、+前缀、关键词三种查询返回技能元数据。工具返回Command包装的ToolMessage。不需要改图状态。

## 四、重要性评级

评级：4分。

理由：SkillSearchSetup是技能延迟发现的装配开关。空与填充两种形态决定提示词策略。它让系统提示词保持轻量。它是两字段的frozen dataclass。给4分。
