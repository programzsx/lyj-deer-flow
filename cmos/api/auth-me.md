# 获取当前用户信息

## 接口地址

接口地址是`GET /api/v1/auth/me`。
网关端口是8001。
完整地址是`http://localhost:8001/api/v1/auth/me`。

## 接口鉴权
这个接口需要登录。
认证方式支持两种。
第一种是session cookie的`access_token`。
第二种是PAT的`Authorization: Bearer dfp_...`。
这个接口不需要特定权限。任何已认证凭据都可以访问。
token来源是`POST /api/v1/auth/login/local`。
GET请求不需要CSRF头。
这个接口免CSRF校验。

## 请求入参
这个接口没有请求体。也没有路径参数和查询参数。

## 响应出参
响应体来自`UserResponse`模型。响应示例来自源码响应模型推导。
- `id`：字符串。用户ID。
- `email`：字符串。用户邮箱。
- `system_role`：字符串。角色。取值是`admin`或`user`。
- `needs_setup`：布尔值。是否需要完成首次设置。默认false。
- `oauth_provider`：字符串或null。OAuth或SSO提供商ID。例如`keycloak`。本地登录是null。
- `permissions`：字符串数组或null。这个凭据的有效路由权限。只有本接口会返回。

响应示例。
```json
{
  "id": "u-001",
  "email": "user@example.com",
  "system_role": "user",
  "needs_setup": false,
  "oauth_provider": null,
  "permissions": ["threads:read", "threads:write", "runs:read", "runs:create"]
}
```

## curl命令
```bash
curl -X GET "http://localhost:8001/api/v1/auth/me" \
  -H "Authorization: Bearer <token>"
```
