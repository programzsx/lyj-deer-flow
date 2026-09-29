# 获取特性开关

## 接口地址

请求方法是`GET`。

完整路径是`/api/features`。

网关端口是8001。

完整地址是`http://localhost:8001/api/features`。

本接口没有路径参数。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口不要求管理员权限。

任何已认证用户都可以查询特性开关。

## 请求入参

本接口没有请求参数。

本接口没有请求体。

请求示例。

```
GET /api/features HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`FeaturesResponse`模型推导。

- `agents_api`：自定义代理管理API的可用性。是一个对象。
- `browser_control`：实时浏览器控制的可用性。是一个对象。
- `mcp_tasks`：持久MCP任务运行时的可用性。是一个对象。
- `subagent_batches`：原生子代理批次的持久化与执行能力。是一个对象。
- `conversation_references`：运行请求上显式会话引用的可用性。是一个对象。
- `knowledge_base`：RAGFlow检索范围选择的可用性。是一个对象。

`agents_api`对象包含以下字段。

- `enabled`：agents_api路由是否通过HTTP开放。布尔值。取自`agents_api.enabled`配置。该配置支持热重载。

`browser_control`对象包含以下字段。

- `enabled`：实时浏览器路由和界面是否可用。布尔值。取自浏览器能力探测结果。

`mcp_tasks`对象包含以下字段。

- `enabled`：持久MCP任务API和界面是否可用。布尔值。报告启动时实际启动的能力。不是热重载配置值。

`subagent_batches`对象包含以下字段。

- `enabled`：兼容别名。与`worker_running`相同。布尔值。
- `repository_available`：持久批次历史API是否可用。布尔值。
- `worker_running`：本Gateway进程是否在执行持久批次工作。布尔值。
- `max_running`：本Gateway进程的原生子代理执行槽位数。整数。

`conversation_references`对象包含以下字段。

- `enabled`：`read_conversation`工具是否已配置。已配置时运行请求可以携带`conversation_references`。布尔值。
- `max_references`：单个运行请求接受的最大会话引用数。整数。

`knowledge_base`对象包含以下字段。

- `scope_selection_enabled`：聊天是否可以选择每消息的RAGFlow检索范围。布尔值。

响应示例来自源码响应模型推导。

```json
{
  "agents_api": {"enabled": true},
  "browser_control": {"enabled": false},
  "mcp_tasks": {"enabled": true},
  "subagent_batches": {"enabled": true, "repository_available": true, "worker_running": true, "max_running": 4},
  "conversation_references": {"enabled": false, "max_references": 3},
  "knowledge_base": {"scope_selection_enabled": true}
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/features
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" http://localhost:8001/api/features
```
