# 批次条目列表接口

## 接口地址

- 请求方法是GET。
- 完整路径是`/api/threads/{thread_id}/subagent-batches/{batch_id}/items`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/threads/thread-xyz/subagent-batches/batch-001/items`。
- 路径参数`thread_id`是会话线程的ID。
- 路径参数`batch_id`是子智能体批次的ID。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限装饰器是`@require_permission("threads", "read", owner_check=True)`。
- 调用者需要`threads:read`权限。
- 权限校验带所有者检查。调用者必须是该线程的所有者。
- 未登录时返回401。
- 批次不存在、不属于当前用户或线程ID不匹配时返回404。
- PAT Bearer调用会返回403。PAT允许清单不包含本接口。

## 请求入参

- 本接口没有请求体。
- 查询参数有3个。
- 路径参数`thread_id`是线程ID。
- 路径参数`batch_id`是批次ID。

参数说明：

- `offset`：整数。可选。默认值是0。分页起始偏移量。
- `limit`：整数。可选。默认值是100。取值范围是1到500。单页返回的条目数量上限。
- `status`：字符串。可选。按条目状态过滤。取值是`pending`、`queued`、`leased`、`running`、`succeeded`、`failed`或`cancelled`。未知状态返回422。

## 响应出参

- 响应是条目对象数组。
- 默认不包含`prompt`和`result`的完整内容。条目列表返回`result_preview`预览。
- 响应示例来自源码响应模型推导。

条目对象字段说明：

- `id`：字符串。条目ID。
- `batch_id`：字符串。所属批次ID。
- `item_key`：字符串。条目键。批次内唯一。
- `position`：整数。条目在批次内的位置。
- `status`：字符串。条目状态。取值是`pending`、`queued`、`leased`、`running`、`succeeded`、`failed`或`cancelled`。
- `attempt`：整数。已尝试次数。
- `model_name`：字符串或null。执行该条目使用的模型名称。
- `result_preview`：字符串或null。结果预览。
- `result_truncated`：布尔值。结果是否被截断。
- `error`：字符串或null。错误信息。
- `stop_reason`：字符串或null。停止原因。
- `token_usage`：对象或null。该条目的token用量。
- `acceptance_criteria`：数组或null。验收标准列表。
- `acceptance_verdict`：对象。验收判定结果。服务端会做结构校验。
- `started_at`：字符串或null。开始时间。ISO格式。
- `completed_at`：字符串或null。完成时间。ISO格式。
- `created_at`：字符串。创建时间。ISO格式。
- `updated_at`：字符串。更新时间。ISO格式。

响应示例：

```json
[
  {
    "id": "item-001",
    "batch_id": "batch-001",
    "item_key": "doc-1",
    "position": 0,
    "status": "succeeded",
    "attempt": 1,
    "model_name": "deepseek-chat",
    "result_preview": "文档分析了前200字……",
    "result_truncated": true,
    "error": null,
    "stop_reason": null,
    "token_usage": {"input_tokens": 1200, "output_tokens": 800},
    "acceptance_criteria": ["输出包含摘要"],
    "acceptance_verdict": {"passed": true},
    "started_at": "2026-09-29T08:01:00+00:00",
    "completed_at": "2026-09-29T08:02:30+00:00",
    "created_at": "2026-09-29T08:00:00+00:00",
    "updated_at": "2026-09-29T08:02:30+00:00"
  }
]
```

## curl命令

```bash
curl -X GET "http://localhost:8001/api/threads/thread-xyz/subagent-batches/batch-001/items?offset=0&limit=100" \
  -b "access_token=<token>"
```
