# 获取子代理列表

## 接口地址

请求方法是`GET`。

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

本接口不要求管理员权限。

任何已认证用户都可以列出运行时目录。

但系统提示词只对管理员可见。

非管理员返回的`system_prompt`是`null`。

## 请求入参

本接口没有请求参数。

本接口没有请求体。

请求示例。

```
GET /api/subagents HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`SubagentsListResponse`模型推导。

- `subagents`：子代理数组。按名称排序。同一名称按来源顺序排列。来源顺序是`builtin`、`config`、`managed`。

`subagents`数组中每个元素的字段来自源码`SubagentResponse`模型推导。

- `name`：子代理名称。字符串。
- `display_name`：显示名称。可为`null`。
- `description`：描述。字符串。
- `system_prompt`：系统提示词。仅管理员可见。可为`null`。
- `tools`：工具白名单。可为`null`。
- `disallowed_tools`：禁止工具列表。可为`null`。
- `skills`：技能白名单。可为`null`。
- `model`：模型覆盖。默认`inherit`。
- `max_turns`：最大回合数。默认50。
- `timeout_seconds`：超时秒数。默认900。
- `enabled`：是否启用。布尔值。默认`true`。
- `source`：来源。取值是`builtin`、`config`、`managed`之一。
- `editable`：是否可编辑。managed来源为`true`。其他为`false`。
- `conflict`：是否与其他来源的名称冲突。布尔值。默认`false`。
- `config_overrides`：config.yaml中的显式覆盖。字典。默认空对象。

响应示例来自源码响应模型推导。

```json
{
  "subagents": [
    {
      "name": "bash-agent",
      "display_name": null,
      "description": "Bash execution agent",
      "system_prompt": null,
      "tools": ["bash"],
      "disallowed_tools": null,
      "skills": null,
      "model": "inherit",
      "max_turns": 50,
      "timeout_seconds": 900,
      "enabled": true,
      "source": "builtin",
      "editable": false,
      "conflict": false,
      "config_overrides": {}
    },
    {
      "name": "research-agent",
      "display_name": "Research",
      "description": "Managed research agent",
      "system_prompt": "You are a research agent...",
      "tools": null,
      "disallowed_tools": null,
      "skills": null,
      "model": "inherit",
      "max_turns": 50,
      "timeout_seconds": 900,
      "enabled": true,
      "source": "managed",
      "editable": true,
      "conflict": false,
      "config_overrides": {}
    }
  ]
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/subagents
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" http://localhost:8001/api/subagents
```
