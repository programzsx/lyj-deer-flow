# SkillStateConfig档案

一、这个类是干什么的

SkillStateConfig是单个技能状态的配置类。这个类控制一个技能要不要启用。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是True。这个字段表示这个技能是否启用。

（二）方法

这个类没有自定义方法。这个类只有一个字段。

三、它和谁协作

ExtensionsConfig持有这个类。ExtensionsConfig的skills字典的值类型是这个类。键是技能名。is_skill_enabled方法读取这个实例。没有显式条目的技能默认启用。

四、重要性评级

评级：3分。

理由：这个类只有一个开关字段。它是技能状态的占位。单独存在意义有限。所以重要性低。
