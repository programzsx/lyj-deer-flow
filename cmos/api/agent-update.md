# 更新自定义代理

## 接口地址

请求方法是`PUT`。

完整路径是`/api/agents/{name}`。

网关端口是8001。

完整地址是`http://localhost:8001/api/agents/{name}`。

路径参数`name`是要更新的自定义代理名称。

代理不存在时返回404。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`agents:write`权限。

本接口要求`agents_api.enabled`配置为`true`。

功能未开放时返回403。

代理只写入调用者自己的用户目录。

代理只存在于旧共享布局时返回409。

错误信息提示先运行`scripts/migrate_user_isolation.py`迁移。

## 请求入参

本接口的请求体是一个JSON对象。

请求体字段来自源码`AgentUpdateRequest`模型。

所有字段都是可选的。

省略的字段保留现有值。

- `display_name`：更新的显示名称。`null`清除该值。可为`null`。
- `description`：更新的描述。可为`null`。
- `model`：更新的模型覆盖。可为`null`。未配置的模型返回422。
- `tool_groups`：更新的工具组白名单。可为`null`。
- `mcp_plugins`：更新的MCP安装选择。可选。`null`表示全部。`[]`表示无。
- `knowledge_scope`：新回合的默认RAGFlow范围。可选。可为`null`。
- `skills`：更新的技能白名单。可选。`null`表示继承全部。`[]`表示无技能。列表表示白名单。
- `allowed_subagents`：更新的子代理白名单。可选。`null`表示全部。`[]`表示硬拒绝。列表表示白名单。
- `model_settings`：更新的采样覆盖。可选。内部省略的子字段保留现有值。`null`清除整块。
- `thinking_enabled`：更新的思考模式默认值。可为`null`。
- `reasoning_effort`：更新的推理力度默认值。取值是`low`、`medium`、`high`之一。可为`null`。
- `soul`：更新的SOUL.md内容。可为`null`。

名称不合法时返回422。

本接口不会清除手工编写的`github:`绑定等非托管字段。

请求示例。

```json
{
  "description": "An updated research agent",
  "model_settings": {"temperature": 0.5},
  "soul": "You are an updated research assistant..."
}
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`AgentResponse`模型推导。

- `name`：代理名称。连字符小写格式。
- `display_name`：可选的Unicode显示名称。可为`null`。
- `description`：代理描述。默认空字符串。
- `model`：可选的模型覆盖。可为`null`。
- `tool_groups`：可选的工具组白名单。可为`null`。
- `mcp_plugins`：MCP安装选择。可为`null`。
- `knowledge_scope`：新回合的默认RAGFlow范围。可为`null`。
- `skills`：可选的技能白名单。可为`null`。
- `allowed_subagents`：子代理白名单。可为`null`。
- `model_settings`：每代理采样覆盖。可为`null`。
- `thinking_enabled`：每代理思考模式默认值。可为`null`。
- `reasoning_effort`：每代理推理力度默认值。可为`null`。
- `soul`：SOUL.md内容。可为`null`。

无变更的更新会提交空操作并重新读取当前状态。

响应示例来自源码响应模型推导。

```json
{
  "name": "research-agent",
  "display_name": "研究代理",
  "description": "An updated research agent",
  "model": "gpt-4",
  "tool_groups": ["search"],
  "mcp_plugins": null,
  "knowledge_scope": null,
  "skills": ["deep-research"],
  "allowed_subagents": null,
  "model_settings": {"temperature": 0.5},
  "thinking_enabled": true,
  "reasoning_effort": "high",
  "soul": "You are an updated research assistant..."
}
```

## curl命令

```bash
curl -X PUT -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"description":"An updated research agent","model_settings":{"temperature":0.5}}' http://localhost:8001/api/agents/research-agent
```

也可以使用会话Cookie。

```bash
curl -X PUT -b "access_token=<token>" -H "Content-Type: application/json" -d '{"description":"An updated research agent","model_settings":{"temperature":0.5}}' http://localhost:8001/api/agents/research-agent
```
