# SSO登录回调

## 接口地址

接口地址是`GET /api/v1/auth/callback/{provider}`。
网关端口是8001。
完整地址是`http://localhost:8001/api/v1/auth/callback/{provider}`。
路径参数`provider`是SSO提供商ID。只允许字母、数字、下划线和连字符。

## 接口鉴权
这个接口不需要登录。
这个接口免鉴权。它免CSRF校验。
这个接口由OIDC提供商在用户授权后重定向调用。浏览器通常不应手工调用。
token来源是`POST /api/v1/auth/login/local`。本接口成功后服务端会设置`access_token` cookie。

## 请求入参
这个接口没有请求体。参数通过路径和查询字符串传递。
- `provider`：字符串。路径参数。SSO提供商ID。
- `code`：字符串或null。查询参数。授权码。
- `state`：字符串或null。查询参数。状态值。必须与state cookie匹配。
- `error`：字符串或null。查询参数。提供商返回的错误码。
- `error_description`：字符串或null。查询参数。错误描述。

## 响应出参
响应是302重定向。响应示例来自源码响应模型推导。
这个接口验证state cookie。然后交换授权码。然后验证ID token。然后创建或关联DeerFlow用户。最后设置session cookie和CSRF cookie。
成功时重定向到前端地址。格式是`{frontend_base_url}/auth/callback?next={path}`。
提供商返回错误或认证失败时重定向到`{frontend_base_url}/login?error=sso_failed`。
用户不允许接入时错误码是`sso_not_allowed`。账号冲突时错误码是`sso_account_exists`。
SSO未启用时返回404。缺少code或state返回400。state cookie缺失或过期返回403。state不匹配返回403。

成功重定向示例。
```
HTTP/1.1 302 Found
Location: /auth/callback?next=/workspace
```

## curl命令
```bash
curl -i "http://localhost:8001/api/v1/auth/callback/keycloak?code=xxx&state=xxx"
```
