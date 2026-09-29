# 创建自定义代理

## 接口地址

请求方法是`POST`。

完整路径是`/api/agents`。

网关端口是8001。

完整地址是`http://localhost:8001/api/agents`。

本接口没有路径参数。

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

## 请求入参

本接口的请求体是一个JSON对象。

请求体字段来自源码`AgentCreateRequest`模型。

- `name`：代理名称。必填。必须匹配`^[A-Za-z0-9-]+$`。存储为小写。名称不合法时返回422。
- `display_name`：可选的Unicode显示名称。可为`null`。
- `description`：代理描述。可选。默认空字符串。
- `model`：可选的模型覆盖。可为`null`。未配置的模型返回422。
- `tool_groups`：可选的工具组白名单。可为`null`。
- `mcp_plugins`：MCP安装选择。可选。`null`表示全部。`[]`表示无。
- `knowledge_scope`：新回合的默认RAGFlow范围。可选。可为`null`。
- `skills`：可选的技能白名单。可选。`null`表示全部启用。`[]`表示无。
- `allowed_subagents`：子代理白名单。可选。`null`表示全部启用。`[]`表示无。
- `model_settings`：每代理采样覆盖。可选。包含`temperature`（0.0到2.0）和`max_tokens`。可为`null`。
- `thinking_enabled`：每代理思考模式默认值。可选。可为`null`。
- `reasoning_effort`：每代理推理力度默认值。可选。取值是`low`、`medium`、`high`之一。可为`null`。
- `soul`：SOUL.md内容。可选。默认空字符串。内容是代理个性和行为约束。

代理已存在时返回409。

错误信息是`Agent '<名称>' already exists`。

请求示例。

```json
{
  "name": "research-agent",
  "display_name": "研究代理",
  "description": "A research focused agent",
  "model": "gpt-4",
  "skills": ["deep-research"],
  "soul": "You are a research assistant..."
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

成功时HTTP状态码是201。

响应示例来自源码响应模型推导。

```json
{
  "name": "research-agent",
  "display_name": "研究代理",
  "description": "A research focused agent",
  "model": "gpt-4",
  "tool_groups": null,
  "mcp_plugins": null,
  "knowledge_scope": null,
  "skills": ["deep-research"],
  "allowed_subagents": null,
  "model_settings": null,
  "thinking_enabled": null,
  "reasoning_effort": null,
  "soul": "You are a research assistant..."
}
```

## curl命令

```bash
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"name":"research-agent","display_name":"研究代理","description":"A research focused agent","model":"gpt-4","skills":["deep-research"],"soul":"You are a research assistant..."}' http://localhost:8001/api/agents
```

也可以使用会话Cookie。

```bash
curl -X POST -b "access_token=<token>" -H "Content-Type: application/json" -d '{"name":"research-agent","display_name":"研究代理","description":"A research focused agent","model":"gpt-4","skills":["deep-research"],"soul":"You are a research assistant..."}' http://localhost:8001/api/agents
```
