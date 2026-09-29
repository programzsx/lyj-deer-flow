# 轮询微信扫码登录接口

## 接口地址

- 请求方法是POST。
- 完整路径是`/api/channels/wechat/qr-login/{session_id}/poll`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/channels/wechat/qr-login/qr-session-abc123/poll`。
- 路径参数`session_id`是扫码会话的ID。会话ID来自发起扫码登录接口的响应。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限校验是`require_admin_user`。
- 本接口是admin专属接口。调用者必须是管理员。
- 非管理员返回403。错误信息是`Admin privileges required to manage channel runtime credentials.`。
- 只有会话的所有者可以轮询。会话不存在或不属于当前管理员时返回404。
- PAT Bearer调用会返回403。PAT凭据不携带管理员能力。

## 请求入参

- 请求体是JSON对象。可选。

参数说明：

- `verify_code`：字符串或null。可选。微信展示的验证码。格式是1到16位数字。仅当会话状态为`verification_required`时提交。

行为说明：

- 浏览器需要循环调用本接口来跟踪扫码进度。
- 会话状态确认后。服务端会保存微信机器人凭据并启动微信渠道。
- 凭据保存或启动失败时返回502。
- 响应带有`Cache-Control: no-store`头。

请求示例：

```json
{
  "verify_code": "123456"
}
```

## 响应出参

- 响应是JSON对象。
- 响应示例来自源码响应模型推导。

字段说明：

- `id`：字符串。扫码会话ID。
- `status`：字符串。会话状态。取值是`pending`、`scanned`、`verification_required`、`confirmed`、`expired`或`failed`。
- `qrcode_content`：字符串。二维码内容。
- `expires_in`：整数。会话剩余有效期。单位是秒。
- `provider`：对象或null。状态为`confirmed`时返回渠道提供方状态。其他状态为null。结构是渠道提供方对象。
- `error`：字符串或null。错误码。取值是`network`、`invalid_response`、`verification_rejected`、`verification_blocked`、`already_bound`或null。

响应示例：

```json
{
  "id": "qr-session-abc123",
  "status": "confirmed",
  "qrcode_content": "https://login.weixin.qq.com/qrcode/xyz",
  "expires_in": 45,
  "provider": {
    "provider": "wechat",
    "display_name": "WeChat",
    "enabled": true,
    "configured": true,
    "connectable": true,
    "unavailable_reason": null,
    "auth_mode": "binding_code",
    "connection_status": "not_connected",
    "credential_fields": [
      {"name": "bot_token", "label": "Bot token", "type": "password", "required": true}
    ],
    "credential_values": {"bot_token": "********"}
  },
  "error": null
}
```

## curl命令

```bash
curl -X POST "http://localhost:8001/api/channels/wechat/qr-login/qr-session-abc123/poll" \
  -b "access_token=<token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```
