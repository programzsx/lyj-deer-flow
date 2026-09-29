# 更新托管子代理

## 接口地址

请求方法是`PUT`。

完整路径是`/api/subagents/{name}`。

网关端口是8001。

完整地址是`http://localhost:8001/api/subagents/{name}`。

路径参数`name`是要更新的托管子代理名称。

托管子代理不存在时返回404。

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

本接口有1个路径参数。

- `name`：要更新的托管子代理名称。必填。字符串。名称不合法时返回422。

本接口的请求体是一个JSON对象。

请求体字段来自源码`ManagedSubagentUpdateRequest`模型。

所有字段都是可选的。

省略的字段保留现有值。

- `display_name`：显示名称。可选。可为`null`。
- `description`：描述。可选。最短长度1。可为`null`。
- `system_prompt`：系统提示词。可选。最短长度1。可为`null`。
- `tools`：工具白名单。可选。可为`null`。
- `disallowed_tools`：禁止工具列表。可选。可为`null`。
- `skills`：技能白名单。可选。可为`null`。
- `model`：模型覆盖。可选。必须是`inherit`或已配置的模型名。未知模型返回422。
- `max_turns`：最大回合数。可选。最小值1。可为`null`。
- `timeout_seconds`：超时秒数。可选。最小值1。可为`null`。
- `enabled`：是否启用。可选。布尔值。可为`null`。

更新后的定义校验失败时返回422。

并发删除时返回404。

保留未找到契约。

请求示例。

```json
{
  "description": "An updated managed research agent",
  "max_turns": 40,
  "enabled": false
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
- `enabled`：是否启用。布尔值。
- `source`：来源。固定为`managed`。
- `editable`：是否可编辑。固定为`true`。
- `conflict`：是否与内置或config.yaml名称冲突。布尔值。
- `config_overrides`：config.yaml中的显式覆盖。字典。默认空对象。

响应示例来自源码响应模型推导。

```json
{
  "name": "research-agent",
  "display_name": "Research",
  "description": "An updated managed research agent",
  "system_prompt": "You are a research agent...",
  "tools": null,
  "disallowed_tools": null,
  "skills": null,
  "model": "inherit",
  "max_turns": 40,
  "timeout_seconds": 600,
  "enabled": false,
  "source": "managed",
  "editable": true,
  "conflict": false,
  "config_overrides": {}
}
```

## curl命令

```bash
curl -X PUT -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"description":"An updated managed research agent","max_turns":40,"enabled":false}' http://localhost:8001/api/subagents/research-agent
```

也可以使用会话Cookie。

```bash
curl -X PUT -b "access_token=<token>" -H "Content-Type: application/json" -d '{"description":"An updated managed research agent","max_turns":40,"enabled":false}' http://localhost:8001/api/subagents/research-agent
```
