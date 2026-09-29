# app.gateway.routers.artifacts-档案

源码路径是backend/app/gateway/routers/artifacts.py。

## 一、这个模块是干什么的

artifacts.py是产物路由。

产物是智能体运行产生的文件。

产物包括报告、代码文件、图表、活动页面。

这个模块负责读取和编辑这些文件。

用户在聊天页面里点开一个产物，就调用这个模块。

这个模块有600多行。

## 二、模块里的主要成员

路由前缀是/api。

### 1、端点列表

- GET "/threads/{thread_id}/artifacts/{path}"读取产物内容。
- PUT "/threads/{thread_id}/artifacts/{path}"替换产物内容。

GET支持download参数强制下载。

GET支持字节Range请求。

Range请求让大文件支持断点读取。

活动HTML内容强制下载。

活动HTML防止在线执行任意脚本。

### 2、编辑安全

PUT要求请求携带SHA-256。

SHA-256匹配文件当前内容才允许替换。

这防止覆盖别人刚改过的内容。

替换是原子操作。

_replace_artifact_atomically用临时文件加替换实现原子性。

编辑限制在outputs目录下。

_normalize_editable_artifact_path规范路径并拒绝越界。

### 3、沙箱同步

_commit_artifact_update把修改同步到沙箱。

沙箱里的文件和宿主机保持一致。

### 4、技能归档支持

产物读取还能从.skill归档里提取文件。

_extract_file_from_skill_archive负责提取。

## 三、它和谁协作

上游是前端产物查看器和编辑器。

下游是线程隔离的文件系统目录。

依赖沙箱同步产物修改。

依赖app.gateway.path_utils解析虚拟路径。

授权走require_permission加owner检查。

## 重要性评级

评级是8分。

理由如下。

产物是智能体输出的主要形态。

用户看结果、改结果都靠这个模块。

SHA-256校验和原子替换保证编辑安全。

活动HTML强制下载是安全约束。

Range支持对大文件很重要。

但纯读取场景的失败不影响智能体运行。

所以评级是8分。
