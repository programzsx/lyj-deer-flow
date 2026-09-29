# 列出可用的SSO提供商

## 接口地址

接口地址是`GET /api/v1/auth/providers`。
网关端口是8001。
完整地址是`http://localhost:8001/api/v1/auth/providers`。

## 接口鉴权
这个接口不需要登录。
这个接口免鉴权。它免CSRF校验。
token来源是`POST /api/v1/auth/login/local`。

## 请求入参
这个接口没有请求体。也没有路径参数和查询参数。

## 响应出参
响应体是一个对象。只返回安全的前端元数据。不含密钥、端点和内部配置。
响应示例来自源码响应模型推导。
- `providers`：数组。已启用的SSO提供商列表。SSO未启用时是空数组。每个元素包含以下字段。

- `id`：字符串。提供商ID。
- `display_name`：字符串。显示名称。
- `type`：字符串。提供商类型。OIDC提供商固定是`oidc`。

响应示例。
```json
{
  "providers": [
    {
      "id": "keycloak",
      "display_name": "Keycloak",
      "type": "oidc"
    }
  ]
}
```

## curl命令
```bash
curl -X GET "http://localhost:8001/api/v1/auth/providers"
```
