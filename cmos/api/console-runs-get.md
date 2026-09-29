# 获取跨线程运行列表

## 接口地址

请求方法是`GET`。

完整路径是`/api/console/runs`。

网关端口是8001。

完整地址是`http://localhost:8001/api/console/runs`。

本接口没有路径参数。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`runs:read`权限。

只返回当前用户的运行记录。

未认证时返回所有运行记录。

本接口是只读的可观测性接口。

## 请求入参

本接口有3个查询参数。

- `limit`：每页条数。可选。取值1到100。默认20。
- `offset`：偏移量。可选。最小值0。默认0。
- `status`：运行状态过滤。可选。字符串。例如`running`、`success`、`error`。

本接口没有请求体。

请求示例。

```
GET /api/console/runs?limit=20&offset=0&status=success HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`ConsoleRunsResponse`模型推导。

- `runs`：运行条目数组。按最新在前排序。
- `has_more`：是否还有更多记录。布尔值。

`runs`数组中每个元素的字段来自源码`ConsoleRunItem`模型推导。

- `run_id`：运行唯一标识。
- `thread_id`：所属线程ID。
- `thread_title`：线程显示名称。取自`threads_meta`。未跟踪时可为`null`。
- `assistant_id`：代理ID。可为`null`。
- `status`：运行状态。字符串。
- `model_name`：模型名称。可为`null`。
- `created_at`：创建时间。可为`null`。
- `updated_at`：更新时间。可为`null`。
- `duration_seconds`：墙钟时长秒数。活跃运行显示已流逝时间。可为`null`。
- `total_tokens`：token总数。整数。默认0。
- `message_count`：消息数。整数。默认0。
- `cost`：本次运行的花费。可为`null`。模型未定价时为`null`。
- `error`：失败运行的错误摘录。可为`null`。

未配置SQL数据库后端时返回503。

响应示例来自源码响应模型推导。

```json
{
  "runs": [
    {
      "run_id": "run_abc123",
      "thread_id": "thread_xyz",
      "thread_title": "DeerFlow research",
      "assistant_id": "lead_agent",
      "status": "success",
      "model_name": "gpt-4",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:31:00Z",
      "duration_seconds": 60.0,
      "total_tokens": 12345,
      "message_count": 8,
      "cost": 0.123456,
      "error": null
    }
  ],
  "has_more": false
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" "http://localhost:8001/api/console/runs?limit=20&offset=0"
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" "http://localhost:8001/api/console/runs?limit=20&offset=0"
```
