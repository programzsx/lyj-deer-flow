# SkillExportNotice档案

来源文件：`backend/app/gateway/skill_export.py`

## 一、这个类是干什么的

这个类是技能导出的提示条目。

这个类继承自Pydantic的`BaseModel`。

技能导出清单里会报告警告和阻断项。

每条警告或阻断对应一个这个类的实例。

这个类携带三样信息。

错误码、说明、可选的文件路径。

## 二、类的成员

这个类有三个Pydantic字段。

### 1、字段code

`code`是错误码字符串。

错误码是程序可读的标识。

前端拿错误码做条件渲染或翻译。

### 2、字段message

`message`是说明字符串。

`message`是给人看的错误描述。

### 3、字段path

`path`是关联的文件路径，可为`None`。

提示关联到具体文件时才填这个字段。

## 三、它和谁协作

这个类被`SkillExportManifestResponse`的`warnings`和`blockers`字段聚合。

消费方是技能导出的清单接口和前端页面。

这个类的数据由harness层的`SkillExportError`映射而来。

同模块的`export_http_error()`也拿同结构的code、message、path构造HTTP错误详情。

## 四、重要性评级

评级：3分。

理由：这个类是技能导出提示的最小信令单元。错误码加说明加路径的结构让提示既可程序处理也可人读。但这个类只有三个字段，没有行为。所以这个类是简单的提示数据模型。
