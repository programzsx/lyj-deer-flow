# 创建个人访问令牌

## 接口地址

接口地址是`POST /api/v1/auth/pats`。
网关端口是8001。
完整地址是`http://localhost:8001/api/v1/auth/pats`。

## 接口鉴权
这个接口需要登录。
认证方式只支持session cookie的`access_token`。
PAT认证的调用者返回403。PAT管理必须使用交互式会话认证。
这个接口不需要特定权限。任何已登录用户都可以创建自己的令牌。
token来源是`POST /api/v1/auth/login/local`。
用session cookie发起POST请求时需要携带`X-CSRF-Token`头。

## 请求入参
请求体来自`PATCreateRequest`模型。
- `name`：字符串。必填。令牌名称。最小长度1。最大长度128。纯空白名称会被拒绝。
- `scopes`：字符串数组。必填。权限范围列表。至少一个元素。
- `expires_in_days`：整数或null。有效期天数。取值范围是1到365。null表示永不过期。默认null。

请求示例JSON。
```json
{
  "name": "automation-token",
  "scopes": ["threads:read", "runs:read"],
  "expires_in_days": 30
}
```

## 响应出参
响应体来自`PATCreatedResponse`模型。状态码是201。响应示例来自源码响应模型推导。
原始token只返回一次。之后无法再次获取。服务端只持久化SHA-256摘要。
- `id`：字符串。令牌ID。
- `name`：字符串。令牌名称。
- `scopes`：字符串数组。权限范围。
- `expires_at`：字符串或null。过期时间。永不过期时是null。
- `created_at`：字符串。创建时间。
- `token`：字符串。原始令牌。格式是`dfp_...`。只显示一次。

scope校验失败返回400。
响应示例。
```json
{
  "id": "pat-001",
  "name": "automation-token",
  "scopes": ["threads:read", "runs:read"],
  "expires_at": "2026-10-29T08:00:00+00:00",
  "created_at": "2026-09-29T08:00:00+00:00",
  "token": "dfp_example_raw_token_value"
}
```

## curl命令
```bash
curl -X POST "http://localhost:8001/api/v1/auth/pats" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "automation-token", "scopes": ["threads:read", "runs:read"], "expires_in_days": 30}'
```
