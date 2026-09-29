# SkillExportManifestResponse档案

来源文件：`backend/app/gateway/skill_export.py`

## 一、这个类是干什么的

这个类是技能导出清单检查的响应模型。

这个类继承自Pydantic的`BaseModel`。

技能导出前先做清单检查。

清单检查返回这个技能能不能导出、包含什么、有什么警告和阻断。

这个类就是那个完整清单。

这个类聚合的内容包括技能名、修订、能否导出、文件和目录数量、总字节、文件列表、需求、警告、阻断项。

前端拿这个模型渲染导出确认页面。

## 二、类的成员

这个类有十个Pydantic字段。

### 1、字段skill_name

`skill_name`是技能名称字符串。

### 2、字段revision

`revision`是技能修订号，可为`None`。

### 3、字段can_export

`can_export`是布尔值，表示这个技能当前能否导出。

有阻断项时`can_export`为假。

### 4、字段file_count、directory_count、total_bytes

`file_count`是文件数量。

`directory_count`是目录数量。

`total_bytes`是全部内容的总字节数。

### 5、字段files

`files`是`SkillExportFile`列表。

每个元素是清单里的一个文件或目录条目。

### 6、字段requirements

`requirements`是`SkillExportRequirements`对象。

requirements描述这个技能的兼容性、允许的工具、必需的密钥。

### 7、字段warnings、blockers

`warnings`是`SkillExportNotice`列表。

warnings是警告，不阻断导出。

`blockers`是`SkillExportNotice`列表。

blockers是阻断项，有阻断项就不能导出。

## 三、它和谁协作

这个类由技能导出的清单接口创建。

这个类聚合`SkillExportFile`和`SkillExportRequirements`、`SkillExportNotice`。

底层的数据来自harness层的技能导出模块。

消费方是技能导出的API路由和前端导出确认页。

## 四、重要性评级

评级：4分。

理由：这个类是技能导出功能的对外主模型。导出确认页面的全部信息都来自这个类。这个类的warnings和blockers分离让导出的可导性判断清晰。但这个类是纯数据模型，没有行为逻辑。所以这个类是导出功能的重要对外契约。
