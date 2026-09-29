# 取消微信扫码登录接口

## 接口地址

- 请求方法是DELETE。
- 完整路径是`/api/channels/wechat/qr-login/{session_id}`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/channels/wechat/qr-login/qr-session-abc123`。
- 路径参数`session_id`是扫码会话的ID。会话ID来自发起扫码登录接口的响应。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限校验是`require_admin_user`。
- 本接口是admin专属接口。调用者必须是管理员。
- 非管理员返回403。错误信息是`Admin privileges required to manage channel runtime credentials.`。
- 只有会话的所有者可以取消。会话不存在或不属于当前管理员时返回404。
- PAT Bearer调用会返回403。PAT凭据不携带管理员能力。

## 请求入参

- 本接口没有请求体。
- 路径参数`session_id`是扫码会话ID。

行为说明：

- 取消会清空当前进程的扫码会话。
- 响应带有`Cache-Control: no-store`头。

## 响应出参

- 成功时响应状态码是204。
- 成功时响应体为空。

## curl命令

```bash
curl -X DELETE "http://localhost:8001/api/channels/wechat/qr-login/qr-session-abc123" \
  -b "access_token=<token>"
```
