# 发起微信扫码登录接口

## 接口地址

- 请求方法是POST。
- 完整路径是`/api/channels/wechat/qr-login`。
- 网关端口是8001。
- 完整URL是`http://localhost:8001/api/channels/wechat/qr-login`。
- 本接口没有路径参数。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限校验是`require_admin_user`。
- 本接口是admin专属接口。调用者必须是管理员。
- 非管理员返回403。错误信息是`Admin privileges required to manage channel runtime credentials.`。
- PAT Bearer调用会返回403。PAT凭据不携带管理员能力。
- 微信渠道连接功能关闭时返回400。
- 网关必须以单进程模式运行。多进程时返回503。需要设置`GATEWAY_WORKERS=1`。
- 另一个管理员正在连接微信时返回409。

## 请求入参

- 本接口没有请求体。

行为说明：

- 本接口向微信请求一个登录二维码。
- 每个进程同时只有一个扫码会话。
- 会话有效期180秒。
- 响应带有`Cache-Control: no-store`头。

## 响应出参

- 响应是JSON对象。
- 响应示例来自源码响应模型推导。

字段说明：

- `id`：字符串。扫码会话ID。
- `status`：字符串。会话状态。取值是`pending`、`scanned`、`verification_required`、`confirmed`、`expired`或`failed`。
- `qrcode_content`：字符串。二维码内容。用于渲染二维码。
- `expires_in`：整数。会话剩余有效期。单位是秒。
- `provider`：对象或null。确认后返回的渠道提供方状态。确认前为null。
- `error`：字符串或null。错误码。取值是`network`、`invalid_response`、`verification_rejected`、`verification_blocked`、`already_bound`或null。

响应示例：

```json
{
  "id": "qr-session-abc123",
  "status": "pending",
  "qrcode_content": "https://login.weixin.qq.com/qrcode/xyz",
  "expires_in": 180,
  "provider": null,
  "error": null
}
```

## curl命令

```bash
curl -X POST "http://localhost:8001/api/channels/wechat/qr-login" \
  -b "access_token=<token>"
```
