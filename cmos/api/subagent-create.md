# 创建托管子代理

## 接口地址

请求方法是`POST`。

完整路径是`/api/subagents`。

网关端口是8001。

完整地址是`http://localhost:8001/api/subagents`。

本接口没有路径参数。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口是管理员专属接口。

非管理员调用返回403。

错误信息是`Admin privileges are required to manage subagents.`。

## 请求入参

本接口的请求体是一个JSON对象。

请求体字段来自源码`ManagedSubagentCreateRequest`模型。

- `name`：子代理名称。必填。字符串。必须匹配托管子代理名称模式。名称不合法时返回422。
- `display_name`：显示名称。可选。可为`null`。
- `description`：描述。必填。字符串。最短长度1。
- `system_prompt`：系统提示词。必填。字符串。最短长度1。
- `tools`：工具白名单。可选。可为`null`。
- `disallowed_tools`：禁止工具列表。可选。可为`null`。
- `skills`：技能白名单。可选。可为`null`。
- `model`：模型覆盖。可选。默认`inherit`。必须是`inherit`或已配置的模型名。未知模型返回422。
- `max_turns`：最大回合数。可选。最小值1。默认50。
- `timeout_seconds`：超时秒数。可选。最小值1。默认900。
- `enabled`：是否启用。可选。布尔值。默认`true`。

名称被内置或config.yaml定义保留时返回409。

托管子代理已存在时返回409。

错误信息是`Managed subagent '<名称>' already exists`。

请求示例。

```json
{
  "name": "research-agent",
  "display_name": "Research",
  "description": "A managed research agent",
  "system_prompt": "You are a research agent...",
  "model": "inherit",
  "max_turns": 30,
  "timeout_seconds": 600
}
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`SubagentResponse`模型推导。

- `name`：子代理名称。
- `display_name`：显示名称。可为`null`。
- `description`：描述。
- `system_prompt`：系统提示词。
- `tools`：工具白名单。可为`null`。
- `disallowed_tools`：禁止工具列表。可为`null`。
- `skills`：技能白名单。可为`null`。
- `model`：模型覆盖。默认`inherit`。
- `max_turns`：最大回合数。默认50。
- `timeout_seconds`：超时秒数。默认900。
- `enabled`：是否启用。布尔值。默认`true`。
- `source`：来源。固定为`managed`。
- `editable`：是否可编辑。固定为`true`。
- `conflict`：是否与内置或config.yaml名称冲突。布尔值。
- `config_overrides`：config.yaml中的显式覆盖。字典。默认空对象。

成功时HTTP状态码是201。

响应示例来自源码响应模型推导。

```json
{
  "name": "research-agent",
  "display_name": "Research",
  "description": "A managed research agent",
  "system_prompt": "You are a research agent...",
  "tools": null,
  "disallowed_tools": null,
  "skills": null,
  "model": "inherit",
  "max_turns": 30,
  "timeout_seconds": 600,
  "enabled": true,
  "source": "managed",
  "editable": true,
  "conflict": false,
  "config_overrides": {}
}
```

## curl命令

```bash
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"name":"research-agent","display_name":"Research","description":"A managed research agent","system_prompt":"You are a research agent...","model":"inherit","max_turns":30,"timeout_seconds":600}' http://localhost:8001/api/subagents
```

也可以使用会话Cookie。

```bash
curl -X POST -b "access_token=<token>" -H "Content-Type: application/json" -d '{"name":"research-agent","display_name":"Research","description":"A managed research agent","system_prompt":"You are a research agent...","model":"inherit","max_turns":30,"timeout_seconds":600}' http://localhost:8001/api/subagents
```
