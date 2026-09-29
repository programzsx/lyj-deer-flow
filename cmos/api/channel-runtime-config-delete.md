# 断开渠道运行时配置接口

## 接口地址

- 请求方法是DELETE。
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
- PAT Bearer调用会返回403。PAT凭据不携带管理员能力。
- 未知提供方返回404。
- 渠道连接功能关闭时返回400。
- 渠道未启用时返回400。

## 请求入参

- 本接口没有请求体。
- 路径参数`provider`是提供方标识。

行为说明：

- 本接口清除该渠道的运行时凭据配置。
- 服务端会先尝试停止该渠道运行时。
- 停止失败时返回400。
- 成功后服务端会撤销数据库中该渠道的所有用户连接。
- 成功后服务端会清除运行时配置存储中该渠道的配置。

## 响应出参

- 响应是断开后的渠道提供方对象。
- 结构与渠道提供方列表接口的元素一致。
- `configured`会变成false。`credential_values`会变成空对象。
- 响应示例来自源码响应模型推导。

响应示例：

```json
{
  "provider": "slack",
  "display_name": "Slack",
  "enabled": true,
  "configured": false,
  "connectable": false,
  "unavailable_reason": "Enter the required Slack credentials to connect this channel.",
  "auth_mode": "binding_code",
  "connection_status": "not_connected",
  "credential_fields": [
    {"name": "bot_token", "label": "Bot token", "type": "password", "required": true},
    {"name": "app_token", "label": "App token", "type": "password", "required": true}
  ],
  "credential_values": {}
}
```

## curl命令

```bash
curl -X DELETE "http://localhost:8001/api/channels/slack/runtime-config" \
  -b "access_token=<token>"
```
