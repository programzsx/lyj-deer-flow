# 运行反馈查询接口

## 接口地址

请求方法是`GET`。

完整路径是`/api/runs/{run_id}/feedback`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/runs/run_123/feedback`。

路径参数说明如下。

- `run_id`：运行ID。字符串类型。表示要查询反馈的运行。

## 接口鉴权

认证方式有两种。

第一种是session cookie认证。

浏览器先登录。登录接口是`POST /api/v1/auth/login/local`。

登录成功后，网关下发HttpOnly的`access_token`cookie。

后续请求携带该cookie。

第二种是PAT认证。

PAT是个人访问令牌。令牌以`dfp_`开头。

请求时放在`Authorization`头部。格式是`Bearer <token>`。

token来源说明如下。

session cookie的token来自登录接口。

PAT的token来自用户在令牌管理接口创建的令牌。

权限说明如下。

源码使用装饰器`@require_permission("runs", "read")`。

调用者需要`runs:read`权限。

session用户的权限来自授权配置。授权关闭时，session用户拥有全部权限。

PAT调用者需要令牌作用域包含`runs:read`。

该路由在PAT路由白名单内。PAT以令牌所属用户的身份执行。

运行不存在或不属于调用者时返回404。

## 请求入参

路径参数说明如下。

- `run_id`：运行ID。字符串类型。表示要查询反馈的运行。

本接口没有请求体。

本接口没有查询参数。

请求示例见curl命令一节。

## 响应出参

成功返回HTTP 200。

响应是该运行的全部反馈记录组成的数组。

响应字段说明如下。

- `feedback_id`：反馈记录ID。字符串类型。
- `run_id`：运行ID。字符串类型。
- `thread_id`：会话ID。字符串类型。
- `user_id`：提交反馈的用户ID。字符串类型或`null`。
- `message_id`：消息ID。字符串类型或`null`。反馈未限定到消息时为`null`。
- `rating`：反馈评分。整数类型。取值是`1`或`-1`。
- `comment`：反馈文字内容。字符串类型或`null`。
- `created_at`：创建时间。字符串类型。ISO格式。

响应示例来自源码响应模型推导。

```json
[
  {
    "feedback_id": "fb_001",
    "run_id": "run_123",
    "thread_id": "th_abc",
    "user_id": "user_1",
    "message_id": null,
    "rating": 1,
    "comment": "回答很有帮助",
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

## curl命令

```bash
curl -s http://localhost:8001/api/runs/run_123/feedback \
  -H "Authorization: Bearer <token>"
```

session cookie方式的curl命令如下。

```bash
curl -s http://localhost:8001/api/runs/run_123/feedback \
  -H "Cookie: access_token=<token>"
```
