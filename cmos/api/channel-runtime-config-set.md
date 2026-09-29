# 配置渠道运行时凭据接口

## 接口地址

- 请求方法是POST。
- 完整路径是`/api/channels/{provider}/runtime-config`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/channels/slack/runtime-config`。
- 路径参数`provider`是渠道提供方标识。取值例如`telegram`、`slack`、`discord`、`feishu`、`dingtalk`、`wechat`、`wecom`、`buzz`。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限校验是`require_admin_user`。
- 本接口是admin专属接口。调用者必须是管理员。
- 非管理员返回403。错误信息是`Admin privileges required to manage channel runtime credentials.`。
- 管理员判断基于用户的`system_role`等于`admin`。
- PAT Bearer调用会返回403。PAT凭据不携带管理员能力。
- 未知提供方返回404。
- 渠道连接功能关闭时返回400。
- 渠道未启用时返回400。

## 请求入参

- 请求体是JSON对象。

参数说明：

- `values`：对象。必填。凭据键值对。键名与该渠道的凭据字段对应。

各渠道的凭据键：

- `telegram`：`bot_token`、`bot_username`。
- `slack`：`bot_token`、`app_token`。
- `discord`：`bot_token`。
- `feishu`：`app_id`、`app_secret`。
- `dingtalk`：`client_id`、`client_secret`。
- `wechat`：`bot_token`。
- `wecom`：`bot_id`、`bot_secret`。
- `buzz`：`relay_url`、`private_key`。

校验规则：

- 必填字段缺失时返回400。
- password类型字段传掩码`********`时保留已有凭据值。
- 配置成功后服务端会尝试重启该渠道运行时。
- 渠道启动失败时返回400。

请求示例：

```json
{
  "values": {
    "bot_token": "xoxb-123456",
    "app_token": "xapp-654321"
  }
}
```

## 响应出参

- 响应是配置后的渠道提供方对象。
- 结构与渠道提供方列表接口的元素一致。
- 响应示例来自源码响应模型推导。

响应示例：

```json
{
  "provider": "slack",
  "display_name": "Slack",
  "enabled": true,
  "configured": true,
  "connectable": true,
  "unavailable_reason": null,
  "auth_mode": "binding_code",
  "connection_status": "not_connected",
  "credential_fields": [
    {"name": "bot_token", "label": "Bot token", "type": "password", "required": true},
    {"name": "app_token", "label": "App token", "type": "password", "required": true}
  ],
  "credential_values": {"bot_token": "********", "app_token": "********"}
}
```

## curl命令

```bash
curl -X POST "http://localhost:8001/api/channels/slack/runtime-config" \
  -b "access_token=<token>" \
  -H "Content-Type: application/json" \
  -d '{
    "values": {
      "bot_token": "xoxb-123456",
      "app_token": "xapp-654321"
    }
  }'
```
