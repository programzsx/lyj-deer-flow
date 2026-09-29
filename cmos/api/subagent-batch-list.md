# 批次列表接口

## 接口地址

- 请求方法是GET。
- 完整路径是`/api/threads/{thread_id}/subagent-batches`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/threads/thread-xyz/subagent-batches`。
- 路径参数`thread_id`是会话线程的ID。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限装饰器是`@require_permission("threads", "read", owner_check=True)`。
- 调用者需要`threads:read`权限。
- 权限校验带所有者检查。调用者必须是该线程的所有者。
- 未登录时返回401。
- PAT Bearer调用会返回403。PAT允许清单不包含本接口。

## 请求入参

- 本接口没有请求体。
- 查询参数有1个。
- 路径参数`thread_id`是线程ID。

参数说明：

- `limit`：整数。可选。默认值是20。取值范围是1到100。单页返回的批次数量上限。

## 响应出参

- 响应是批次对象数组。
- 数组按创建时间倒序排列。
- 数组只包含该线程且属于当前用户的批次。
- 响应示例来自源码响应模型推导。

批次对象字段说明：

- `id`：字符串。批次ID。
- `thread_id`：字符串。所属线程ID。
- `title`：字符串。批次标题。
- `subagent_type`：字符串。子智能体类型。
- `status`：字符串。批次状态。取值例如`queued`、`running`、`paused`、`completed`、`failed`、`cancelled`。
- `total_items`：整数。批次内条目总数。
- `max_live_items`：整数。允许的最大活跃条目数。
- `max_running_items`：整数。允许的最大运行中条目数。
- `max_attempts`：整数。每个条目的最大尝试次数。
- `created_at`：字符串。创建时间。ISO格式。
- `updated_at`：字符串。更新时间。ISO格式。
- `completed_at`：字符串或null。完成时间。ISO格式。
- `counts`：对象。各状态条目的数量统计。

`counts`对象字段说明：

- `pending`：整数。待处理条目数。
- `queued`：整数。排队中条目数。
- `leased`：整数。已租约条目数。
- `running`：整数。运行中条目数。
- `succeeded`：整数。成功条目数。
- `failed`：整数。失败条目数。
- `cancelled`：整数。已取消条目数。

响应示例：

```json
[
  {
    "id": "batch-001",
    "thread_id": "thread-xyz",
    "title": "批量文档分析",
    "subagent_type": "general-purpose",
    "status": "running",
    "total_items": 10,
    "max_live_items": 4,
    "max_running_items": 4,
    "max_attempts": 3,
    "created_at": "2026-09-29T08:00:00+00:00",
    "updated_at": "2026-09-29T08:05:00+00:00",
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
]
```

## curl命令

```bash
curl -X GET "http://localhost:8001/api/threads/thread-xyz/subagent-batches?limit=20" \
  -b "access_token=<token>"
```
