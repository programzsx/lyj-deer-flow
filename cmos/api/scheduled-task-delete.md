# 删除定时任务接口

## 接口地址

- 请求方法是DELETE。
- 完整路径是`/api/scheduled-tasks/{task_id}`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/scheduled-tasks/task-1a2b3c4d`。
- 路径参数`task_id`是定时任务的ID。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限装饰器是`@require_permission("threads", "write")`。
- 调用者需要`threads:write`权限。
- 未登录时返回401。
- 任务不存在或不属于调用者时返回404。
- 任务正在启动或运行时返回409。
- PAT Bearer调用会返回403。PAT允许清单不包含本接口。

## 请求入参

- 本接口没有请求体。
- 路径参数`task_id`是任务ID。

行为说明：

- 删除会同时取消排队中的执行。排队执行的错误信息是`scheduled task was deleted while queued`。
- 正在启动或运行的执行会阻止删除。这种情况下返回409。

## 响应出参

- 响应是JSON对象。
- 响应示例来自源码响应模型推导。

字段说明：

- `id`：字符串。被删除的任务ID。
- `deleted`：布尔值。固定为`true`。表示删除成功。

响应示例：

```json
{
  "id": "task-1a2b3c4d5e6f7g8h",
  "deleted": true
}
```

## curl命令

```bash
curl -X DELETE "http://localhost:8001/api/scheduled-tasks/task-1a2b3c4d5e6f7g8h" \
  -b "access_token=<token>"
```
