# SkillExportRequirements档案

来源文件：`backend/app/gateway/skill_export.py`

## 一、这个类是干什么的

这个类是技能导出的需求说明。

这个类继承自Pydantic的`BaseModel`。

一个技能导出到别的环境后，需要在那个环境里满足一些条件才能运行。

这个类描述那些条件。

条件有三类。

兼容性要求、允许的工具、必需的密钥。

## 二、类的成员

这个类有三个Pydantic字段。

### 1、字段compatibility

`compatibility`是兼容性要求字符串，可为`None`。

compatibility描述这个技能对运行环境的要求。

### 2、字段allowed_tools

`allowed_tools`是允许的工具列表，可为`None`。

allowed_tools列出这个技能被授权使用的工具名。

### 3、字段required_secrets

`required_secrets`是`SkillExportSecret`列表，可为`None`。

required_secrets列出导入这个技能后需要配置的密钥。

每个密钥条目有名和是否可选两个属性。

## 三、它和谁协作

这个类被`SkillExportManifestResponse`的`requirements`字段持有。

这个类聚合`SkillExportSecret`条目。

消费方是技能导出的清单接口和前端页面。

这个类的数据由harness层的技能导出模块提供。

## 四、重要性评级

评级：3分。

理由：这个类是技能导出需求的说明载体。导入方靠这个类知道技能需要什么条件。这个类只有三个字段，都是描述性的。所以这个类是简单的需求说明模型。
