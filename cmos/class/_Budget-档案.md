# _Budget档案

源码位置：backend/packages/harness/deerflow/skills/export.py

## 一、这个类是干什么的

_Budget是技能导出的资源预算。

导出要遍历技能目录。遍历可能很慢。遍历的对象是不可信的文件系统。_Budget给整个导出过程一个截止时间。_Budget还响应取消事件。

_Budget在导出开始时创建。截止时间是创建时刻加DEADLINE_SECONDS。导出流程在每个关键步骤调用check。

## 二、类的成员

（一）字段

- deadline：截止时刻。time.monotonic加DEADLINE_SECONDS。
- cancel_event：取消事件。可以为None。

（二）方法

- check：检查预算。取消事件被置位时抛SkillExportError（503，skill_export_cancelled）。到达截止时间时抛SkillExportError（503，skill_export_timeout）。

## 三、它和谁协作

（一）使用范围

check渗透到导出的每一步。_walk每次访问目录前检查。_walk处理每个文件前检查。_open_directory_chain每级目录检查。_guard_frontmatter每个YAML事件检查。_LimitedWriter每次写入检查。_manifest也检查。

（二）异常

check抛的是SkillExportError。异常带503状态码。错误码区分取消和超时。

## 四、重要性评级

评级：5分。

理由：_Budget是导出功能的资源护栏。它让不可信文件系统上的遍历有确定的时限。它让长时间导出可以被取消。检查点渗透到每个小步骤。给5分。
