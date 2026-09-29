# 本地邮箱密码登录

## 接口地址

接口地址是`POST /api/v1/auth/login/local`。
网关端口是8001。
完整地址是`http://localhost:8001/api/v1/auth/login/local`。

## 接口鉴权
这个接口不需要登录。
这个接口是认证入口。它自己免鉴权。它免CSRF校验。
token来源是本接口。登录成功后服务端会设置`access_token` session cookie。
同IP多次失败登录会被限流。失败次数达到阈值后返回429。

## 请求入参
请求体是表单格式。字段来自`OAuth2PasswordRequestForm`和表单参数。
- `username`：字符串。必填。登录邮箱。表单字段名是`username`。
- `password`：字符串。必填。登录密码。
- `remember_me`：布尔值。是否持久化会话cookie。默认true。

## 响应出参
响应体来自`LoginResponse`模型。token只存放在HttpOnly cookie里。
响应示例来自源码响应模型推导。
- `expires_in`：整数。会话有效期。单位秒。值是`token_expiry_days * 24 * 3600`。
- `needs_setup`：布尔值。用户是否需要完成首次设置。默认false。

登录成功时响应会设置`access_token` cookie。凭据错误时返回401。
响应示例。
```json
{
  "expires_in": 864000,
  "needs_setup": false
}
```

## curl命令
```bash
curl -X POST "http://localhost:8001/api/v1/auth/login/local" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=<password>&remember_me=true"
```
