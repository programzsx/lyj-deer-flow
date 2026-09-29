# 获取自定义代理详情

## 接口地址

请求方法是`GET`。

完整路径是`/api/agents/{name}`。

网关端口是8001。

完整地址是`http://localhost:8001/api/agents/{name}`。

路径参数`name`是自定义代理名称。

代理不存在时返回404。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`agents:read`权限。

本接口要求`agents_api.enabled`配置为`true`。

功能未开放时返回403。

## 请求入参

本接口有1个路径参数。

- `name`：要查询的代理名称。必填。字符串。存储时会规范化为小写。名称不合法时返回422。

本接口没有请求体。

请求示例。

```
GET /api/agents/research-agent HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`AgentResponse`模型推导。

- `name`：代理名称。连字符小写格式。
- `display_name`：可选的Unicode显示名称。可为`null`。
- `description`：代理描述。默认空字符串。
- `model`：可选的模型覆盖。可为`null`。
- `tool_groups`：可选的工具组白名单。可为`null`。
- `mcp_plugins`：MCP安装选择。`null`表示全部。`[]`表示无。可为`null`。
- `knowledge_scope`：新回合的默认RAGFlow范围。可为`null`。
- `skills`：可选的技能白名单。可为`null`。
- `allowed_subagents`：子代理白名单。可为`null`。
- `model_settings`：每代理采样覆盖。可为`null`。
- `thinking_enabled`：每代理思考模式默认值。可为`null`。
- `reasoning_effort`：每代理推理力度默认值。取值是`low`、`medium`、`high`之一。可为`null`。
- `soul`：SOUL.md内容。可为`null`。

响应示例来自源码响应模型推导。

```json
{
  "name": "research-agent",
  "display_name": "研究代理",
  "description": "A research focused agent",
  "model": "gpt-4",
  "tool_groups": ["search"],
  "mcp_plugins": null,
  "knowledge_scope": null,
  "skills": ["deep-research"],
  "allowed_subagents": null,
  "model_settings": {"temperature": 0.7},
  "thinking_enabled": true,
  "reasoning_effort": "high",
  "soul": "You are a research assistant..."
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/agents/research-agent
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" http://localhost:8001/api/agents/research-agent
```
