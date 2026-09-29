# 获取线程MCP任务列表

## 接口地址

请求方法是`GET`。

完整路径是`/api/threads/{thread_id}/mcp-tasks`。

网关端口是8001。

完整地址是`http://localhost:8001/api/threads/{thread_id}/mcp-tasks`。

路径参数`thread_id`是会话线程ID。

线程不存在时返回404。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

未认证调用返回401。

错误信息是`Authentication required`。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`threads:read`权限。

本接口需要线程属主校验。

只返回当前用户在该属主线程上的持久任务。

## 请求入参

本接口有1个路径参数。

- `thread_id`：会话线程ID。必填。字符串。

本接口有1个查询参数。

- `limit`：返回条数上限。可选。取值1到100。默认50。

本接口没有请求体。

请求示例。

```
GET /api/threads/thread_xyz/mcp-tasks?limit=50 HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON数组。

数组中每个元素是一个MCP任务的条目。

响应字段来自源码`_list_item`逻辑推导。

- `task_id`：任务唯一标识。字符串。
- `task_name`：任务名称。字符串。
- `status`：任务状态。字符串。
- `created_at`：创建时间。字符串。
- `updated_at`：更新时间。字符串。
- `error`：任务错误。最多500字符。可为`null`。
- `tracking_degraded`：连续轮询错误是否达到降级阈值。布尔值。
- `cancel_requested`：是否已请求取消。布尔值。依据`cancel_requested_at`是否非空。

本接口不暴露远程任务ID和驱动配置。

响应示例来自源码响应模型推导。

```json
[
  {
    "task_id": "task_abc123",
    "task_name": "long-running-analysis",
    "status": "running",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:31:00Z",
    "error": null,
    "tracking_degraded": false,
    "cancel_requested": false
  }
]
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" "http://localhost:8001/api/threads/thread_xyz/mcp-tasks?limit=50"
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" "http://localhost:8001/api/threads/thread_xyz/mcp-tasks?limit=50"
```
