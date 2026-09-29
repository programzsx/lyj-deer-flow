# 运行反馈更新接口

## 接口地址

请求方法是`PUT`。

完整路径是`/api/threads/{thread_id}/runs/{run_id}/feedback`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/threads/th_abc/runs/run_123/feedback`。

路径参数说明如下。

- `thread_id`：会话ID。字符串类型。表示运行所在的会话。
- `run_id`：运行ID。字符串类型。表示要更新反馈的运行。

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

源码使用装饰器`@require_permission("threads", "write", owner_check=True, require_existing=True)`。

调用者需要`threads:write`权限。

`owner_check=True`表示网关会校验调用者是否拥有该会话。

`require_existing=True`表示会话必须真实存在。不存在的会话返回404。

调用者不拥有该会话时返回404。

session用户的权限来自授权配置。授权关闭时，session用户拥有全部权限。

PAT调用者需要令牌作用域包含`threads:write`。

该路由在PAT路由白名单内。PAT以令牌所属用户的身份执行。

## 请求入参

路径参数说明如下。

- `thread_id`：会话ID。字符串类型。表示运行所在的会话。
- `run_id`：运行ID。字符串类型。表示要更新反馈的运行。

请求体是JSON对象。

请求字段说明如下。

- `rating`：反馈评分。整数类型。必填。取值是`1`或`-1`。`1`表示好评。`-1`表示差评。其他取值返回400。
- `comment`：反馈文字内容。字符串类型或`null`。可选。默认值是`null`。

本接口不支持`message_id`参数。更新后的反馈不限定到具体消息。

请求示例来自源码请求模型推导。

```json
{
  "rating": -1,
  "comment": "回答不准确"
}
```

## 响应出参

成功返回HTTP 200。

本接口是幂等的更新接口。

本接口会创建或更新当前用户对该运行的反馈。

本接口会校验运行存在且属于该会话。校验失败返回404。

响应字段说明如下。

- `feedback_id`：反馈记录ID。字符串类型。
- `run_id`：运行ID。字符串类型。
- `thread_id`：会话ID。字符串类型。
- `user_id`：提交反馈的用户ID。字符串类型或`null`。
- `message_id`：消息ID。字符串类型或`null`。
- `rating`：反馈评分。整数类型。返回`1`或`-1`。
- `comment`：反馈文字内容。字符串类型或`null`。
- `created_at`：创建时间。字符串类型。ISO格式。

响应示例来自源码响应模型推导。

```json
{
  "feedback_id": "fb_001",
  "run_id": "run_123",
  "thread_id": "th_abc",
  "user_id": "user_1",
  "message_id": null,
  "rating": -1,
  "comment": "回答不准确",
  "created_at": "2026-01-01T00:00:00Z"
}
```

## curl命令

```bash
curl -s -X PUT http://localhost:8001/api/threads/th_abc/runs/run_123/feedback \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"rating": -1, "comment": "回答不准确"}'
```

session cookie方式的curl命令如下。

```bash
curl -s -X PUT http://localhost:8001/api/threads/th_abc/runs/run_123/feedback \
  -H "Cookie: access_token=<token>" \
  -H "Content-Type: application/json" \
  -d '{"rating": -1, "comment": "回答不准确"}'
```
