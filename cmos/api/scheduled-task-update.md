# 更新定时任务接口

## 接口地址

- 请求方法是PATCH。
- 完整路径是`/api/scheduled-tasks/{task_id}`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/scheduled-tasks/task-1a2b3c4d`。
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

- 请求体是JSON对象。
- 所有字段都是可选的。
- 服务端只应用非null字段。

参数说明：

- `title`：字符串或null。最少1个字符。新的任务标题。
- `prompt`：字符串或null。最少1个字符。新的提示词。
- `context_mode`：字符串或null。新的上下文模式。取值是`fresh_thread_per_run`或`reuse_thread`。
- `thread_id`：字符串或null。新的绑定线程ID。`reuse_thread`模式下必须有可用线程。线程不存在时返回404。
- `assistant_id`：字符串或null。新的智能体名称。会做归一化校验。
- `schedule_spec`：对象或null。新的调度参数。
- `timezone`：字符串或null。新的时区名称。

校验规则：

- 任务状态为`running`时返回409。
- 任务有活跃的排队或启动中的执行时返回409。排队状态可以先把任务暂停再修改。
- 修改了`schedule_spec`或`timezone`时。服务端会重新计算`next_run_at`。
- `interval`类型只改时区且间隔不变时。保留原`next_run_at`。
- `once`类型的新时间必须在未来且至少等于最小延迟。
- 终端状态的任务被推到未来后。服务端会把状态改回`enabled`。

请求示例：

```json
{
  "prompt": "生成今日工作周报",
  "schedule_spec": {"cron": "0 8 * * *"}
}
```

## 响应出参

- 响应是更新后的定时任务对象。
- 字段与查询单个定时任务接口的结构一致。
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
  "prompt": "生成今日工作周报",
  "schedule_type": "cron",
  "schedule_spec": {"cron": "0 8 * * *"},
  "timezone": "Asia/Shanghai",
  "status": "enabled",
  "overlap_policy": "enqueue",
  "next_run_at": "2026-09-30T00:00:00+00:00",
  "last_run_at": "2026-09-29T01:00:00+00:00",
  "last_run_id": "run-abc",
  "last_thread_id": "thread-xyz",
  "last_error": null,
  "lease_owner": null,
  "lease_expires_at": null,
  "run_count": 12,
  "created_at": "2026-09-01T00:00:00+00:00",
  "updated_at": "2026-09-29T08:00:00+00:00"
}
```

## curl命令

```bash
curl -X PATCH "http://localhost:8001/api/scheduled-tasks/task-1a2b3c4d5e6f7g8h" \
  -b "access_token=<token>" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "生成今日工作周报",
    "schedule_spec": {"cron": "0 8 * * *"}
  }'
```
