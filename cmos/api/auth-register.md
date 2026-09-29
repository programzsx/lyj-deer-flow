# 注册本地用户

## 接口地址

接口地址是`POST /api/v1/auth/register`。
网关端口是8001。
完整地址是`http://localhost:8001/api/v1/auth/register`。

## 接口鉴权
这个接口不需要登录。
这个接口免鉴权。它免CSRF校验。
注册成功后服务端会自动登录并设置`access_token` session cookie。
部署关闭了`auth.local.allow_registration`时返回403。
token来源是`POST /api/v1/auth/login/local`。

## 请求入参
请求体来自`RegisterRequest`模型。
- `email`：字符串。必填。注册邮箱。必须是合法邮箱格式。
- `password`：字符串。必填。密码。最小长度8。常见弱密码会被拒绝。
- `remember_me`：布尔值。是否持久化会话cookie。默认true。

请求示例JSON。
```json
{
  "email": "user@example.com",
  "password": "a-strong-password",
  "remember_me": true
}
```

## 响应出参
响应体来自`UserResponse`模型。状态码是201。响应示例来自源码响应模型推导。
- `id`：字符串。新用户ID。
- `email`：字符串。注册邮箱。
- `system_role`：字符串。角色。注册用户固定是`user`。取值是`admin`或`user`。
- `needs_setup`：布尔值。是否需要完成首次设置。默认false。
- `oauth_provider`：字符串或null。OAuth提供商ID。本地注册是null。
- `permissions`：字符串数组或null。有效权限。凭据创建响应不返回。值是null。

邮箱已注册时返回400。
响应示例。
```json
{
  "id": "u-001",
  "email": "user@example.com",
  "system_role": "user",
  "needs_setup": false,
  "oauth_provider": null,
  "permissions": null
}
```

## curl命令
```bash
curl -X POST "http://localhost:8001/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "a-strong-password", "remember_me": true}'
```
