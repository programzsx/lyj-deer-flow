# 渠道提供方列表接口

## 接口地址

- 请求方法是GET。
- 完整路径是`/api/channels/providers`。
- 网关端口是8001。
- 完整URL是`http://localhost:8001/api/channels/providers`。
- 本接口没有路径参数。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码没有`@require_permission`装饰器。
- 本接口要求登录。未登录时返回401。
- 本接口返回当前用户视角的渠道状态。
- PAT Bearer调用会返回403。PAT允许清单不包含本接口。

## 请求入参

- 本接口没有请求体。
- 本接口没有查询参数。

## 响应出参

- 响应是JSON对象。
- 响应示例来自源码响应模型推导。

字段说明：

- `enabled`：布尔值。渠道连接功能是否开启。取值来自配置`channel_connections`。
- `providers`：数组。已启用的渠道提供方列表。

`providers`数组元素字段说明：

- `provider`：字符串。提供方标识。取值例如`telegram`、`slack`、`discord`、`feishu`、`dingtalk`、`wechat`、`wecom`、`buzz`。
- `display_name`：字符串。显示名称。
- `enabled`：布尔值。该渠道是否启用。
- `configured`：布尔值。凭据是否已配置。结合配置状态和运行时状态。
- `connectable`：布尔值。当前是否可以发起连接。要求已启用、已配置且无不可用原因。
- `unavailable_reason`：字符串或null。不可连接的原因。null表示可以连接。
- `auth_mode`：字符串。认证模式。`telegram`是`deep_link`。其他渠道是`binding_code`。
- `connection_status`：字符串。当前用户的连接状态。例如`connected`、`not_connected`、`revoked`。
- `credential_fields`：数组。凭据字段定义。
- `credential_values`：对象。已配置的凭据值。password类型字段显示为掩码`********`。text类型字段显示原值。

`credential_fields`数组元素字段说明：

- `name`：字符串。字段名。例如`bot_token`。
- `label`：字符串。字段标签。
- `type`：字符串。字段类型。取值是`text`或`password`。
- `required`：布尔值。是否必填。

响应示例：

```json
{
  "enabled": true,
  "providers": [
    {
      "provider": "telegram",
      "display_name": "Telegram",
      "enabled": true,
      "configured": true,
      "connectable": true,
      "unavailable_reason": null,
      "auth_mode": "deep_link",
      "connection_status": "not_connected",
      "credential_fields": [
        {"name": "bot_token", "label": "Bot token", "type": "password", "required": true},
        {"name": "bot_username", "label": "Bot username", "type": "text", "required": true}
      ],
      "credential_values": {"bot_token": "********", "bot_username": "deerflow_bot"}
    }
  ]
}
```

## curl命令

```bash
curl -X GET "http://localhost:8001/api/channels/providers" \
  -b "access_token=<token>"
```
