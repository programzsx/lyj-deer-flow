# 查询线程定时任务接口

## 接口地址

- 请求方法是GET。
- 完整路径是`/api/threads/{thread_id}/scheduled-tasks`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/threads/thread-xyz/scheduled-tasks`。
- 路径参数`thread_id`是会话线程的ID。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限装饰器是`@require_permission("threads", "read", owner_check=True)`。
- 调用者需要`threads:read`权限。
- 权限校验带所有者检查。调用者必须是该线程的所有者。
- 未登录时返回401。
- 不是线程所有者时返回404。
- PAT Bearer调用会返回403。PAT允许清单不包含本接口。

## 请求入参

- 本接口没有请求体。
- 本接口没有查询参数。
- 路径参数`thread_id`是线程ID。任务是按用户ID加线程ID隔离查询的。

## 响应出参

- 响应是定时任务对象数组。
- 数组只包含绑定到该线程的任务。
- 元素结构与定时任务列表接口一致。
- 响应示例来自源码响应模型推导。

响应示例：

```json
[
  {
    "id": "task-1a2b3c4d5e6f7g8h",
    "user_id": "u-001",
    "thread_id": "thread-xyz",
    "context_mode": "reuse_thread",
    "assistant_id": "lead_agent",
    "title": "线程内周检",
    "prompt": "检查本线程内容并汇总",
    "schedule_type": "cron",
    "schedule_spec": {"cron": "0 9 * * 1"},
    "timezone": "Asia/Shanghai",
    "status": "enabled",
    "overlap_policy": "enqueue",
    "next_run_at": "2026-10-05T01:00:00+00:00",
    "last_run_at": null,
    "last_run_id": null,
    "last_thread_id": null,
    "last_error": null,
    "lease_owner": null,
    "lease_expires_at": null,
    "run_count": 0,
    "created_at": "2026-09-28T00:00:00+00:00",
    "updated_at": "2026-09-28T00:00:00+00:00"
  }
]
```

## curl命令

```bash
curl -X GET "http://localhost:8001/api/threads/thread-xyz/scheduled-tasks" \
  -b "access_token=<token>"
```
