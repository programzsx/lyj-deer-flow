# 恢复子智能体批次接口

## 接口地址

- 请求方法是POST。
- 完整路径是`/api/threads/{thread_id}/subagent-batches/{batch_id}/resume`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/threads/thread-xyz/subagent-batches/batch-001/resume`。
- 路径参数`thread_id`是会话线程的ID。
- 路径参数`batch_id`是子智能体批次的ID。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限装饰器是`@require_permission("threads", "write", owner_check=True)`。
- 调用者需要`threads:write`权限。
- 权限校验带所有者检查。调用者必须是该线程的所有者。
- 未登录时返回401。
- 批次不存在、不属于当前用户或线程ID不匹配时返回404。
- PAT Bearer调用会返回403。PAT允许清单不包含本接口。

## 请求入参

- 本接口没有请求体。
- 路径参数`thread_id`是线程ID。
- 路径参数`batch_id`是批次ID。

行为说明：

- 批次状态为`paused`时恢复成功。
- 恢复后批次状态变成`queued`。
- 其他状态的批次不受影响。

## 响应出参

- 响应是恢复后的批次对象。
- 字段与批次列表接口的元素结构一致。
- 响应示例来自源码响应模型推导。

响应示例：

```json
{
  "id": "batch-001",
  "thread_id": "thread-xyz",
  "title": "批量文档分析",
  "subagent_type": "general-purpose",
  "status": "queued",
  "total_items": 10,
  "max_live_items": 4,
  "max_running_items": 4,
  "max_attempts": 3,
  "created_at": "2026-09-29T08:00:00+00:00",
  "updated_at": "2026-09-29T08:07:00+00:00",
  "completed_at": null,
  "counts": {
    "pending": 2,
    "queued": 1,
    "leased": 0,
    "running": 4,
    "succeeded": 3,
    "failed": 0,
    "cancelled": 0
  }
}
```

## curl命令

```bash
curl -X POST "http://localhost:8001/api/threads/thread-xyz/subagent-batches/batch-001/resume" \
  -b "access_token=<token>"
```
