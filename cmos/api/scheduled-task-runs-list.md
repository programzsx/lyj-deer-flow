# 查询定时任务执行记录接口

## 接口地址

- 请求方法是GET。
- 完整路径是`/api/scheduled-tasks/{task_id}/runs`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/scheduled-tasks/task-1a2b3c4d/runs`。
- 路径参数`task_id`是定时任务的ID。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限装饰器是`@require_permission("threads", "read")`。
- 调用者需要`threads:read`权限。
- 未登录时返回401。
- 任务不存在或不属于调用者时返回404。
- PAT Bearer调用会返回403。PAT允许清单不包含本接口。

## 请求入参

- 本接口没有请求体。
- 查询参数有3个。

参数说明：

- `limit`：整数。可选。默认值是50。取值范围是1到200。单页返回的记录数上限。
- `offset`：整数。可选。默认值是0。分页起始偏移量。
- `status`：字符串。可选。按执行状态过滤。取值是`queued`、`launching`、`running`、`success`、`failed`、`skipped`或`interrupted`。

## 响应出参

- 响应是执行记录对象数组。
- 数组按创建时间倒序排列。
- 响应示例来自源码响应模型推导。

执行记录对象字段说明：

- `id`：字符串。执行记录ID。
- `task_id`：字符串。所属任务ID。
- `thread_id`：字符串。本次执行使用的线程ID。
- `run_id`：字符串或null。本次执行产生的运行ID。
- `scheduled_for`：字符串。计划执行时间。ISO格式。
- `trigger`：字符串。触发方式。取值是`manual`或调度触发。
- `status`：字符串。执行状态。取值是`queued`、`launching`、`running`、`success`、`failed`、`skipped`或`interrupted`。
- `error`：字符串或null。执行错误信息。
- `lease_owner`：字符串或null。当前持有该执行的调度器实例标识。
- `lease_expires_at`：字符串或null。租约过期时间。ISO格式。
- `attempt_count`：整数。尝试次数。
- `started_at`：字符串或null。开始时间。ISO格式。
- `finished_at`：字符串或null。结束时间。ISO格式。
- `created_at`：字符串。创建时间。ISO格式。

响应示例：

```json
[
  {
    "id": "run-occ-001",
    "task_id": "task-1a2b3c4d5e6f7g8h",
    "thread_id": "thread-xyz",
    "run_id": "run-abc",
    "scheduled_for": "2026-09-29T01:00:00+00:00",
    "trigger": "scheduled",
    "status": "success",
    "error": null,
    "lease_owner": null,
    "lease_expires_at": null,
    "attempt_count": 1,
    "started_at": "2026-09-29T01:00:01+00:00",
    "finished_at": "2026-09-29T01:02:30+00:00",
    "created_at": "2026-09-29T01:00:00+00:00"
  }
]
```

## curl命令

```bash
curl -X GET "http://localhost:8001/api/scheduled-tasks/task-1a2b3c4d5e6f7g8h/runs?limit=50&offset=0" \
  -b "access_token=<token>"
```
