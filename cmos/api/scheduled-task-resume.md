# 恢复定时任务接口

## 接口地址

- 请求方法是POST。
- 完整路径是`/api/scheduled-tasks/{task_id}/resume`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/scheduled-tasks/task-1a2b3c4d/resume`。
- 路径参数`task_id`是定时任务的ID。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限装饰器是`@require_permission("threads", "write")`和`@require_permission("runs", "create")`。
- 调用者需要`threads:write`和`runs:create`两个权限。
- 未登录时返回401。
- 任务不存在或不属于调用者时返回404。
- 任务正在运行或有活跃的排队执行时返回409。
- PAT Bearer调用会返回403。PAT允许清单不包含本接口。

## 请求入参

- 本接口没有请求体。
- 路径参数`task_id`是任务ID。

行为说明：

- 恢复会把任务状态改为`enabled`。
- 恢复后调度器会按`next_run_at`继续调度。

## 响应出参

- 响应是恢复后的定时任务对象。
- 字段与查询单个定时任务接口的结构一致。
- 状态字段会变成`enabled`。
- 响应示例来自源码响应模型推导。

响应示例：

```json
{
  "id": "task-1a2b3c4d5e6f7g8h",
  "user_id": "u-001",
  "thread_id": null,
  "context_mode": "fresh_thread_per_run",
  "assistant_id": "lead_agent",
  "title": "每日报告",
  "prompt": "生成今日工作日报",
  "schedule_type": "cron",
  "schedule_spec": {"cron": "0 9 * * *"},
  "timezone": "Asia/Shanghai",
  "status": "enabled",
  "overlap_policy": "enqueue",
  "next_run_at": "2026-09-30T01:00:00+00:00",
  "last_run_at": "2026-09-29T01:00:00+00:00",
  "last_run_id": "run-abc",
  "last_thread_id": "thread-xyz",
  "last_error": null,
  "lease_owner": null,
  "lease_expires_at": null,
  "run_count": 12,
  "created_at": "2026-09-01T00:00:00+00:00",
  "updated_at": "2026-09-29T09:30:00+00:00"
}
```

## curl命令

```bash
curl -X POST "http://localhost:8001/api/scheduled-tasks/task-1a2b3c4d5e6f7g8h/resume" \
  -b "access_token=<token>"
```
