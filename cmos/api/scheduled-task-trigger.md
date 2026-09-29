# 手动触发定时任务接口

## 接口地址

- 请求方法是POST。
- 完整路径是`/api/scheduled-tasks/{task_id}/trigger`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/scheduled-tasks/task-1a2b3c4d/trigger`。
- 路径参数`task_id`是定时任务的ID。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限装饰器是`@require_permission("threads", "write")`和`@require_permission("runs", "create")`。
- 调用者需要`threads:write`和`runs:create`两个权限。
- 未登录时返回401。
- 任务不存在或不属于调用者时返回404。
- 触发与活跃执行冲突时返回409。
- 派发失败时返回502。
- PAT Bearer调用会返回403。PAT允许清单不包含本接口。

## 请求入参

- 本接口没有请求体。
- 路径参数`task_id`是任务ID。

行为说明：

- 触发会立即派发一次任务执行。
- 触发标记是`manual`。
- 触发可以越过暂停状态。手动触发允许在暂停时排队或运行。
- 手动触发与定时调度共用一次活跃执行的限制。同一时刻每个任务最多一个活跃执行。

## 响应出参

- 响应是JSON对象。
- 响应示例来自源码响应模型推导。

字段说明：

- `id`：字符串。被触发的任务ID。
- `triggered`：布尔值。固定为`true`。表示触发成功。

响应示例：

```json
{
  "id": "task-1a2b3c4d5e6f7g8h",
  "triggered": true
}
```

## curl命令

```bash
curl -X POST "http://localhost:8001/api/scheduled-tasks/task-1a2b3c4d5e6f7g8h/trigger" \
  -b "access_token=<token>"
```
