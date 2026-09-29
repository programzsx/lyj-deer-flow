# 获取UI偏好设置

## 接口地址

请求方法是`GET`。

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

每个用户只能读取自己的偏好设置。

## 请求入参

本接口有1个必需的请求头。

- `X-Expected-User-Id`：前端期望的用户ID。必填。字符串。用于检测登录账号是否已切换。

本接口没有查询参数。

本接口没有请求体。

请求示例。

```
GET /api/v1/auth/preferences HTTP/1.1
Host: localhost:8001
X-Expected-User-Id: user-123
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`Preferences`模型推导。

- `notification_enabled`：是否启用通知。可为`null`。
- `model_name`： remembered的模型名称。最大长度200。可为`null`。
- `mode`：UI模式。取值是`flash`、`thinking`、`pro`、`ultra`之一。可为`null`。
- `reasoning_effort`：remembered的推理力度。最大长度32。匹配`^[A-Za-z0-9_.-]+$`。可为`null`。

存储中的非法可选设置会被跳过。

非法设置不会隐藏页面其余内容。

未存储的偏好字段值为`null`。

响应示例来自源码响应模型推导。

```json
{
  "notification_enabled": true,
  "model_name": "gpt-4",
  "mode": "thinking",
  "reasoning_effort": "high"
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" -H "X-Expected-User-Id: <expected_user_id>" http://localhost:8001/api/v1/auth/preferences
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" -H "X-Expected-User-Id: <expected_user_id>" http://localhost:8001/api/v1/auth/preferences
```
