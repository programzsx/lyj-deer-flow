# 定时任务列表接口

## 接口地址

- 请求方法是GET。
- 完整路径是`/api/scheduled-tasks`。
- 网关端口是8001。
- 完整URL是`http://localhost:8001/api/scheduled-tasks`。
- 本接口没有路径参数。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限装饰器是`@require_permission("threads", "read")`。
- 调用者需要`threads:read`权限。
- 未登录时本接口返回空数组。
- PAT Bearer调用会返回403。PAT允许清单不包含本接口。

## 请求入参

- 本接口没有请求体。
- 本接口没有查询参数。

curl命令示例中不需要请求体。

## 响应出参

- 响应是定时任务对象数组。
- 数组按创建时间倒序排列。
- 响应示例来自源码响应模型推导。

定时任务对象字段说明：

- `id`：字符串。任务ID。格式是`task-`加十六进制随机串。
- `user_id`：字符串。任务所有者的用户ID。
- `thread_id`：字符串或null。任务绑定的会话线程ID。`fresh_thread_per_run`模式下为null。
- `context_mode`：字符串。上下文模式。取值是`fresh_thread_per_run`或`reuse_thread`。
- `assistant_id`：字符串或null。执行任务时使用的智能体名称。
- `title`：字符串。任务标题。
- `prompt`：字符串。任务执行时发送的提示词。
- `schedule_type`：字符串。调度类型。取值是`once`、`cron`或`interval`。
- `schedule_spec`：对象。调度参数。`cron`类型包含`cron`字段。`interval`类型包含`every_seconds`字段。`once`类型包含`run_at`字段。
- `timezone`：字符串。时区名称。例如`Asia/Shanghai`。
- `status`：字符串。任务状态。例如`enabled`、`paused`、`running`、`completed`、`failed`、`cancelled`。
- `overlap_policy`：字符串。重叠策略。默认值是`enqueue`。
- `next_run_at`：字符串或null。下一次执行时间。ISO格式。
- `last_run_at`：字符串或null。上一次执行时间。ISO格式。
- `last_run_id`：字符串或null。上一次执行产生的运行ID。
- `last_thread_id`：字符串或null。上一次执行使用的线程ID。
- `last_error`：字符串或null。上一次执行的错误信息。
- `lease_owner`：字符串或null。当前持有任务的调度器实例标识。
- `lease_expires_at`：字符串或null。租约过期时间。ISO格式。
- `run_count`：整数。累计执行次数。
- `created_at`：字符串。创建时间。ISO格式。
- `updated_at`：字符串。更新时间。ISO格式。

响应示例：

```json
[
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
    "updated_at": "2026-09-29T01:00:05+00:00"
  }
]
```

## curl命令

```bash
curl -X GET "http://localhost:8001/api/scheduled-tasks" \
  -b "access_token=<token>"
```
