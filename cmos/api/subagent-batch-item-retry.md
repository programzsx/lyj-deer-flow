# 重试批次条目接口

## 接口地址

- 请求方法是POST。
- 完整路径是`/api/threads/{thread_id}/subagent-batches/{batch_id}/items/{item_id}/retry`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/threads/thread-xyz/subagent-batches/batch-001/items/item-001/retry`。
- 路径参数`thread_id`是会话线程的ID。
- 路径参数`batch_id`是子智能体批次的ID。
- 路径参数`item_id`是批次条目的ID。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限装饰器是`@require_permission("threads", "write", owner_check=True)`。
- 调用者需要`threads:write`权限。
- 权限校验带所有者检查。调用者必须是该线程的所有者。
- 未登录时返回401。
- 批次不存在、不属于当前用户或线程ID不匹配时返回404。
- 条目不存在或批次ID不匹配时返回409。
- 条目状态不是`failed`时返回409。错误信息是`Only failed items can be retried`。
- PAT Bearer调用会返回403。PAT允许清单不包含本接口。

## 请求入参

- 本接口没有请求体。
- 路径参数`thread_id`是线程ID。
- 路径参数`batch_id`是批次ID。
- 路径参数`item_id`是条目ID。

行为说明：

- 只有失败条目可以重试。
- 重试会把条目状态改回`pending`。
- 重试会把尝试次数清零。会清空错误、结果、结果预览和验收判定。
- 重试会把批次状态改回`queued`。会清空批次的完成时间。

## 响应出参

- 响应是重试后的条目对象。
- 字段与批次条目列表接口的元素结构一致。
- 响应示例来自源码响应模型推导。

响应示例：

```json
{
  "id": "item-002",
  "batch_id": "batch-001",
  "item_key": "doc-2",
  "position": 1,
  "status": "pending",
  "attempt": 0,
  "model_name": null,
  "result_preview": null,
  "result_truncated": false,
  "error": null,
  "stop_reason": null,
  "token_usage": null,
  "acceptance_criteria": ["输出包含摘要"],
  "started_at": null,
  "completed_at": null,
  "created_at": "2026-09-29T08:00:00+00:00",
  "updated_at": "2026-09-29T08:09:00+00:00"
}
```

## curl命令

```bash
curl -X POST "http://localhost:8001/api/threads/thread-xyz/subagent-batches/batch-001/items/item-002/retry" \
  -b "access_token=<token>"
```
