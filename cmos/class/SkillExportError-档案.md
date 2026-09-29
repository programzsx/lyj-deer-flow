# SkillExportError档案

源码位置：backend/packages/harness/deerflow/skills/export.py

## 一、这个类是干什么的

SkillExportError是技能导出的公开错误。

导出可能因为各种原因失败。错误要返回给调用方。错误必须是安全的。安全的意思是错误里没有主机路径。错误里没有源码文本。

SkillExportError继承Exception。SkillExportError携带HTTP状态码、错误码、消息、可选路径。

## 二、类的成员

（一）字段

- status：HTTP状态码。404是技能不存在。409是技能变更。413是超限。422是不支持。500是读取失败。503是取消或超时。
- code：稳定的错误码。错误码例如skill_export_timeout、skill_changed。
- message：公开消息。消息不含主机路径。
- path：可选的路径。可以为None。

## 三、它和谁协作

（一）抛出者

export.py的预算、上限、变更检查都抛它。_Budget.check抛503。_limit抛413。_changed抛409。_capture抛404、422、500。

（二）诊断净化

_issue函数构造路径诊断时净化路径。路径里的控制字符换成替换符。路径截断到1024字节。

（三）消费者

Gateway技能导出路由捕获它。错误转成HTTP响应。

## 四、重要性评级

评级：5分。

理由：SkillExportError是导出功能的统一错误出口。它强制错误消息安全化。主机路径和源文本不会泄露给调用方。状态码和错误码分层让前端可编程处理。给5分。
