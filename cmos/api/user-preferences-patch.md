# 更新UI偏好设置

## 接口地址

请求方法是`PATCH`。

完整路径是`/api/v1/auth/preferences`。

网关端口是8001。

完整地址是`http://localhost:8001/api/v1/auth/preferences`。

本接口没有路径参数。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口要求浏览器会话认证。

非会话来源的请求返回403。

错误信息是`Preferences require an authenticated browser session`。

本接口要求`X-Expected-User-Id`请求头。

缺少该请求头时返回422。

请求头与登录用户不匹配时返回409。

错误信息是`The signed-in account changed; reload this page`。

本接口是属主专属接口。

每个用户只能更新自己的偏好设置。

## 请求入参

本接口有1个必需的请求头。

- `X-Expected-User-Id`：前端期望的用户ID。必填。字符串。用于检测登录账号是否已切换。

本接口的请求体是一个JSON对象。

请求体字段来自源码`Preferences`模型。

未知字段会被拒绝。

未设置的字段不会被修改。

- `notification_enabled`：是否启用通知。可选。布尔值。
- `model_name`：remembered的模型名称。可选。字符串。最大长度200。
- `mode`：UI模式。可选。取值是`flash`、`thinking`、`pro`、`ultra`之一。
- `reasoning_effort`：remembered的推理力度。可选。字符串。最大长度32。匹配`^[A-Za-z0-9_.-]+$`。

请求示例。

```json
{
  "model_name": "gpt-4",
  "mode": "thinking",
  "reasoning_effort": "high"
}
```

## 响应出参

本接口成功时返回204状态码。

本接口没有响应体。

偏好持久化不可用时返回503。

错误信息是`Preference persistence is unavailable`。

## curl命令

```bash
curl -X PATCH -H "Authorization: Bearer <token>" -H "X-Expected-User-Id: <expected_user_id>" -H "Content-Type: application/json" -d '{"model_name":"gpt-4","mode":"thinking","reasoning_effort":"high"}' http://localhost:8001/api/v1/auth/preferences
```

也可以使用会话Cookie。

```bash
curl -X PATCH -b "access_token=<token>" -H "X-Expected-User-Id: <expected_user_id>" -H "Content-Type: application/json" -d '{"model_name":"gpt-4","mode":"thinking","reasoning_effort":"high"}' http://localhost:8001/api/v1/auth/preferences
```
