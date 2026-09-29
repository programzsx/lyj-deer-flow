# 撤销个人访问令牌

## 接口地址

接口地址是`DELETE /api/v1/auth/pats/{pat_id}`。
网关端口是8001。
完整地址是`http://localhost:8001/api/v1/auth/pats/{pat_id}`。
路径参数`pat_id`是令牌ID。

## 接口鉴权
这个接口需要登录。
认证方式只支持session cookie的`access_token`。
PAT认证的调用者返回403。PAT管理必须使用交互式会话认证。
这个接口不需要特定权限。任何已登录用户都可以撤销自己的令牌。
token来源是`POST /api/v1/auth/login/local`。
用session cookie发起DELETE请求时需要携带`X-CSRF-Token`头。

## 请求入参
这个接口没有请求体。
路径参数如下。
- `pat_id`：字符串。令牌ID。

## 响应出参
响应体来自`MessageResponse`模型。撤销立即生效。响应示例来自源码响应模型推导。
- `message`：字符串。结果说明。

令牌不存在或不属于当前用户时返回404。
响应示例。
```json
{
  "message": "Token revoked"
}
```

## curl命令
```bash
curl -X DELETE "http://localhost:8001/api/v1/auth/pats/pat-001" \
  -H "Authorization: Bearer <token>"
```
