# app.gateway.routers.agents-档案

源码路径是backend/app/gateway/routers/agents.py。

## 一、这个模块是干什么的

agents.py是自定义智能体的CRUD API。

智能体定义包含模型、提示词、工具配置。

用户在设置页面创建和编辑智能体，都调用这个模块。

智能体定义保存在config.yaml的agents段里。

## 二、模块里的主要成员

路由前缀是/api。

### 1、端点列表

- GET "/agents"列出智能体。
- GET "/agents/name/{name}/check"检查智能体名称是否可用。
- GET "/agents/{name}"读取单个智能体。
- POST "/agents"创建智能体。
- PUT "/agents/{name}"更新智能体。
- DELETE "/agents/{name}"删除智能体。
- GET "/agents/user-profile"读取用户画像。
- PUT "/agents/user-profile"更新用户画像。

### 2、校验逻辑

_validate_agent_name校验名称合法性。

_validate_model_exists校验模型存在。

_require_agents_api_enabled检查API开关。

### 3、记忆清理

删除智能体会取消未完成的记忆任务。

_cancel_pending_memory_for_agent负责取消。

删除动作通过_delete_agent_with_memory_cancel编排。

## 三、它和谁协作

上游是前端智能体设置页面。

下游是config.yaml的agents配置段。

删除时调用记忆管理器取消挂起任务。

用户画像数据存储在记忆里。

授权走app.gateway.authz。

## 重要性评级

评级是7分。

理由如下。

自定义智能体是产品的重要功能。

用户靠智能体定义定制行为。

没有这个模块，用户只能手改config.yaml。

但系统有内置的默认智能体。

默认智能体不依赖这个模块。

核心对话路径只读智能体定义，不经过这个模块。

所以评级是7分。
