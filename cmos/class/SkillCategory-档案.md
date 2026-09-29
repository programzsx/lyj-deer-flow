# SkillCategory档案

源码位置：backend/packages/harness/deerflow/skills/types.py

## 一、这个类是干什么的

SkillCategory是技能的来源类别。

SkillCategory是StrEnum。SkillCategory的每个值既是枚举又是字符串。

类别决定技能的权限。public技能是内置只读的。custom技能是用户写的，可以编辑删除。integration技能是托管的第三方技能，只读。legacy技能是用户隔离迁移之前的全局自定义技能，只展示不可编辑。

## 二、类的成员

（一）枚举值

- PUBLIC：值是public。平台内置技能。只读。
- CUSTOM：值是custom。用户自建技能。可编辑可删除。
- INTEGRATION：值是integrations。托管第三方集成技能。只读。
- LEGACY：值是legacy。迁移前的全局自定义技能。只读。

## 三、它和谁协作

（一）Skill

Skill的category字段取值是SkillCategory。类别决定技能在容器里的挂载子目录。

（二）存储路径

projection.py按类别拆分技能视图目录。每个类别一个子目录。

（三）review

InstalledSkillReader解析skill://地址时校验类别。类别只允许public、custom、legacy三种。

## 四、重要性评级

评级：6分。

理由：SkillCategory是技能系统的权限词汇。类别决定技能能否编辑、能否删除、挂载在哪里。它只是四个值的枚举。给6分。
