# 发起SSO登录

## 接口地址

接口地址是`GET /api/v1/auth/oauth/{provider}`。
网关端口是8001。
完整地址是`http://localhost:8001/api/v1/auth/oauth/{provider}`。
路径参数`provider`是SSO提供商ID。只允许字母、数字、下划线和连字符。

## 接口鉴权
这个接口不需要登录。
这个接口免鉴权。它免CSRF校验。
token来源是`POST /api/v1/auth/login/local`。SSO回调成功后服务端会设置`access_token` cookie。

## 请求入参
这个接口没有请求体。参数通过路径和查询字符串传递。
- `provider`：字符串。路径参数。SSO提供商ID。
- `next`：字符串或null。查询参数。登录成功后的跳转路径。必须是`/`开头的相对路径。默认`/workspace`。
- `remember_me`：布尔值。查询参数。是否持久化会话cookie。默认true。

## 响应出参
这个接口发起OIDC登录流程。响应是302重定向。
响应示例来自源码响应模型推导。
服务端生成state、nonce和PKCE参数。服务端设置签名的state cookie。
重定向目标是OIDC提供商的授权URL。
SSO未启用时返回404。提供商ID非法或未知时返回400。提供商发现失败时返回502。

302重定向示例。
```
HTTP/1.1 302 Found
Location: https://sso.example.com/authorize?client_id=xxx&state=xxx
```

## curl命令
```bash
curl -i "http://localhost:8001/api/v1/auth/oauth/keycloak?next=/workspace&remember_me=true"
```
