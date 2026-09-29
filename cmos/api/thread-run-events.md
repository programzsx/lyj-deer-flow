# 列出单个运行的全部事件

## 接口地址

接口地址是`GET /api/threads/{thread_id}/runs/{run_id}/events`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/runs/{run_id}/events`。
路径参数`thread_id`是线程ID。线程ID匹配`^[A-Za-z0-9_-]{1,64}$`。
路径参数`run_id`是运行ID。

## 接口鉴权
这个接口需要登录。
认证方式支持两种。
第一种是session cookie的`access_token`。
第二种是PAT的`Authorization: Bearer dfp_...`。
需要的权限是`runs:read`。
这个接口要求调用者是线程的所有者。
token来源是`POST /api/v1/auth/login/local`。
GET请求不需要CSRF头。
运行不存在或不属于这个线程时返回404。

## 请求入参
这个接口没有请求体。参数通过查询字符串传递。
- `event_types`：字符串或null。逗号分隔的事件类型过滤。例如`llm.ai.response,run.delivery`。默认null。
- `task_id`：字符串或null。子任务ID过滤。用于单个子代理任务的分页。默认null。
- `limit`：整数。返回条数上限。取值范围是1到2000。默认500。
- `after_seq`：整数或null。游标。只返回序号大于这个值的行。最小值1。默认null。

## 响应出参
响应体是一个数组。返回这个运行的完整事件流。用于调试和审计。
每行的`metadata`会被服务端脱敏。
响应示例来自源码响应模型推导。
- `seq`：整数。事件序号。
- `run_id`：字符串。所属运行ID。
- `event_type`：字符串。事件类型。
- `category`：字符串。事件类别。
- `content`：事件内容。
- `metadata`：对象。事件元数据。已脱敏。
- `task_id`：字符串。子任务ID。存在时返回。
- `created_at`：字符串。创建时间。

响应示例。
```json
[
  {
    "seq": 1,
    "run_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "event_type": "run.start",
    "category": "run",
    "content": {},
    "metadata": {},
    "created_at": "2026-09-29T08:00:00+00:00"
  },
  {
    "seq": 2,
    "run_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "event_type": "llm.ai.response",
    "category": "message",
    "content": {"type": "ai", "content": "好的，总结如下。"},
    "metadata": {},
    "created_at": "2026-09-29T08:00:05+00:00"
  }
]
```

## curl命令
```bash
curl -X GET "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/runs/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/events?limit=500" \
  -H "Authorization: Bearer <token>"
```
