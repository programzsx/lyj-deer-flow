# app.gateway.skill_export-档案

源码路径是backend/app/gateway/skill_export.py。

## 一、这个模块是干什么的

skill_export.py是技能导出的服务层。

routers/skills.py的导出端点调用它。

导出把一个技能打成归档。

归档可以下载或迁移到别的部署。

这个模块管理导出的并发和断连。

这个模块有188行。

## 二、模块里的主要成员

### 1、run_export_work

run_export_work是导出工作入口。

导出在临时文件的生命周期里运行。

槽位跟着临时文件走。

槽位在全进程所有用户间共享。

槽位限制并发导出数量。

防止导出耗尽资源。

### 2、断连处理

ExportClientDisconnected表示客户端断开。

_disconnected检查请求是否断连。

客户端断开后导出工作被取消。

取消后临时文件被清理。

### 3、响应模型

SkillExportNotice是导出提示。

SkillExportFile是导出文件。

export_http_error把导出错误转成HTTP错误。

### 4、IO执行

_finish_io完成文件IO。

IO用run_file_io在线程池跑。

_drain等待任务结束。

## 三、它和谁协作

上游是routers/skills.py的导出端点。

下游是deerflow.skills.export的导出实现。

归档生成在harness层。

## 重要性评级

评级是4分。

理由如下。

技能导出支持技能迁移和备份。

槽位管理控制并发。

断连处理防资源泄漏。

但导出是低频操作。

体量适中，逻辑聚焦。

核心运行路径不依赖它。

所以评级是4分。
