# 列出个人访问令牌

## 接口地址

接口地址是`GET /api/v1/auth/pats`。
网关端口是8001。
完整地址是`http://localhost:8001/api/v1/auth/pats`。

## 接口鉴权
这个接口需要登录。
认证方式只支持session cookie的`access_token`。
PAT认证的调用者返回403。PAT管理必须使用交互式会话认证。
这个接口不需要特定权限。任何已登录用户都可以列出自己的令牌。
token来源是`POST /api/v1/auth/login/local`。
GET请求不需要CSRF头。

## 请求入参
这个接口没有请求体。也没有路径参数和查询参数。

## 响应出参
响应体是一个数组。每个元素来自`PATSummaryResponse`模型。
这个接口永远不会返回摘要或原始token。
响应示例来自源码响应模型推导。
- `id`：字符串。令牌ID。
- `name`：字符串。令牌名称。
- `scopes`：字符串数组。权限范围。
- `expires_at`：字符串或null。过期时间。
- `last_used_at`：字符串或null。最后使用时间。
- `created_at`：字符串。创建时间。
- `revoked_at`：字符串或null。撤销时间。未撤销是null。

响应示例。
```json
[
  {
    "id": "pat-001",
    "name": "automation-token",
    "scopes": ["threads:read", "runs:read"],
    "expires_at": "2026-10-29T08:00:00+00:00",
    "last_used_at": "2026-09-29T09:00:00+00:00",
    "created_at": "2026-09-29T08:00:00+00:00",
    "revoked_at": null
  }
]
```

## curl命令
```bash
curl -X GET "http://localhost:8001/api/v1/auth/pats" \
  -H "Authorization: Bearer <token>"
```
