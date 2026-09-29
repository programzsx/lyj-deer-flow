# app.gateway.routers.skills-档案

源码路径是backend/app/gateway/routers/skills.py。

## 一、这个模块是干什么的

skills.py是技能路由。

技能是智能体的能力包。

技能包含提示词和资源文件。

技能分公开技能和自定义技能。

公开技能在skills/public目录。

自定义技能在skills/custom目录。

这个模块有860多行，是路由里较大的文件。

## 二、模块里的主要成员

路由前缀是/api。

### 1、通用技能端点

- GET "/skills"列出全部技能。
- GET "/skills/{skill_name}"读取技能详情。
- PUT "/skills/{skill_name}"更新技能开关。
- POST "/skills/reload"刷新技能缓存。

技能列表按角色过滤用户可见目录。

reload要求管理员权限。

reload只影响当前Gateway进程。

### 2、安装端点

- POST "/skills/install"从线程目录的.skill文件安装。
- POST "/skills/install/upload"上传本地.skill归档安装。

管理接口要求管理员权限。

上传先授权再解析。

multipart解析器是有界的。

上限是100MiB文件加1MiB框架。

_BoundedSkillArchiveMultiPartParser负责有界解析。

### 3、自定义技能端点

- GET "/skills/custom"列出自定义技能。
- GET "/skills/custom/{name}"读取技能内容。
- PUT "/skills/custom/{name}"编辑技能。
- DELETE "/skills/custom/{name}"删除技能。
- GET "/skills/custom/{name}/history"读取编辑历史。
- POST "/skills/custom/{name}/rollback"回滚技能。
- GET "/skills/custom/{name}/export-manifest"预览导出清单。
- GET "/skills/custom/{name}/export"下载技能归档。

编辑历史支持回滚。

导出走app.gateway.skill_export。

## 三、它和谁协作

上游是前端技能市场页。

下游是deerflow.skills的技能存储和目录。

安装后的技能进技能目录。

技能列表授权走resolve_skill_authorization。

导出依赖app.gateway.skill_export。

## 重要性评级

评级是8分。

理由如下。

技能是DeerFlow的核心扩展机制。

智能体的领域能力靠技能注入。

安装、开关、编辑、回滚是完整生命周期。

上传的有界解析和先授权后解析是安全设计。

技能直接影响每次运行的提示词。

删除这个模块，技能体系失去管理入口。

所以评级是8分。
