# 创建定时任务接口

## 接口地址

- 请求方法是POST。
- 完整路径是`/api/scheduled-tasks`。
- 网关端口是8001。
- 完整URL是`http://localhost:8001/api/scheduled-tasks`。
- 本接口没有路径参数。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限装饰器是`@require_permission("threads", "write")`和`@require_permission("runs", "create")`。
- 调用者需要`threads:write`和`runs:create`两个权限。
- 未登录时返回401。
- PAT Bearer调用会返回403。PAT允许清单不包含本接口。

## 请求入参

- 请求体是JSON对象。

参数说明：

- `title`：字符串。必填。最少1个字符。任务标题。
- `prompt`：字符串。必填。最少1个字符。任务执行时发送的提示词。
- `schedule_type`：字符串。必填。调度类型。取值是`once`、`cron`或`interval`。
- `schedule_spec`：对象。必填。调度参数。`cron`类型需要`cron`字段。`interval`类型需要正整数`every_seconds`字段。`once`类型需要ISO格式的`run_at`字段。
- `timezone`：字符串。必填。IANA时区名称。例如`Asia/Shanghai`。
- `context_mode`：字符串。可选。默认值是`fresh_thread_per_run`。取值是`fresh_thread_per_run`或`reuse_thread`。
- `thread_id`：字符串或null。可选。默认值是null。`context_mode`为`reuse_thread`时必填。调用者必须是该线程的所有者。线程不存在时返回404。
- `assistant_id`：字符串或null。可选。默认值是`lead_agent`。自定义名称会做小写和连字符归一化。归一化后的名称必须对该用户存在。否则返回422。

校验规则：

- `once`类型的时间必须在未来。
- `once`类型的时间距现在必须至少等于`min_once_delay_seconds`。该值来自配置。
- `interval`类型的`every_seconds`必须不小于`min_once_delay_seconds`。
- `interval`类型的`every_seconds`必须不大于2592000秒。也就是30天。
- `cron`表达式必须正好包含5个字段。服务端会做空白归一化。
- 时区名称必须能被IANA识别。

请求示例：

```json
{
  "title": "每日报告",
  "prompt": "生成今日工作日报",
  "schedule_type": "cron",
  "schedule_spec": {"cron": "0 9 * * *"},
  "timezone": "Asia/Shanghai",
  "context_mode": "fresh_thread_per_run"
}
```

## 响应出参

- 响应是新建的定时任务对象。
- 字段与定时任务列表接口的元素结构一致。
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
  "last_run_at": null,
  "last_run_id": null,
  "last_thread_id": null,
  "last_error": null,
  "lease_owner": null,
  "lease_expires_at": null,
  "run_count": 0,
  "created_at": "2026-09-29T08:00:00+00:00",
  "updated_at": "2026-09-29T08:00:00+00:00"
}
```

## curl命令

```bash
curl -X POST "http://localhost:8001/api/scheduled-tasks" \
  -b "access_token=<token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "每日报告",
    "prompt": "生成今日工作日报",
    "schedule_type": "cron",
    "schedule_spec": {"cron": "0 9 * * *"},
    "timezone": "Asia/Shanghai"
  }'
```
