# 获取追问建议配置

## 接口地址

请求方法是`GET`。

完整路径是`/api/suggestions/config`。

网关端口是8001。

完整地址是`http://localhost:8001/api/suggestions/config`。

本接口没有路径参数。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口不要求管理员权限。

## 请求入参

本接口没有请求参数。

本接口没有请求体。

请求示例。

```
GET /api/suggestions/config HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`SuggestionsConfigResponse`模型推导。

- `enabled`：追问建议是否全局启用。布尔值。取自`suggestions.enabled`配置。
- `max_suggestions`：可生成的最大追问建议数。整数。取值1到上限。默认值来自`suggestions.max_suggestions`配置。

响应示例来自源码响应模型推导。

```json
{
  "enabled": true,
  "max_suggestions": 3
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/suggestions/config
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" http://localhost:8001/api/suggestions/config
```
