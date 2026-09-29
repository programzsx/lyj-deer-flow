# 分页列出线程的运行

## 接口地址

接口地址是`GET /api/threads/{thread_id}/runs/page`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/runs/page`。
路径参数`thread_id`是线程ID。线程ID匹配`^[A-Za-z0-9_-]{1,64}$`。

## 接口鉴权
这个接口需要登录。
认证方式支持两种。
第一种是session cookie的`access_token`。
第二种是PAT的`Authorization: Bearer dfp_...`。
需要的权限是`runs:read`。
这个接口要求调用者是线程的所有者。
token来源是`POST /api/v1/auth/login/local`。
GET请求不需要CSRF头。

## 请求入参
这个接口没有请求体。参数通过查询字符串传递。
- `limit`：整数。每页最大条数。取值范围是1到200。默认50。
- `before_created_at`：字符串或null。游标。ISO-8601时间戳。只返回早于这个时间的运行。默认null。
- `before_run_id`：字符串或null。游标。只返回这个运行之前的记录。默认null。

`before_created_at`和`before_run_id`必须同时提供。只提供一个会返回422。
翻页时把上一页最后一行的`next_before_created_at`和`next_before_run_id`作为游标传入。

## 响应出参
响应体来自`ThreadRunsPageResponse`模型。响应示例来自源码响应模型推导。
- `data`：数组。运行记录列表。每行是最新优先的键集分页结果。每行字段同`RunResponse`。
- `has_more`：布尔值。是否还有下一页。
- `next_before_created_at`：字符串或null。下一页游标。没有下一页时是null。
- `next_before_run_id`：字符串或null。下一页游标。没有下一页时是null。

响应示例。
```json
{
  "data": [
    {
      "run_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "thread_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "assistant_id": null,
      "status": "success",
      "metadata": {},
      "kwargs": {},
      "multitask_strategy": "reject",
      "created_at": "2026-09-29T08:00:00+00:00",
      "updated_at": "2026-09-29T08:00:05+00:00",
      "total_input_tokens": 120,
      "total_output_tokens": 45,
      "total_tokens": 165,
      "llm_call_count": 1,
      "lead_agent_tokens": 165,
      "subagent_tokens": 0,
      "middleware_tokens": 0,
      "message_count": 2,
      "stop_reason": null
    }
  ],
  "has_more": true,
  "next_before_created_at": "2026-09-29T08:00:00+00:00",
  "next_before_run_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```

## curl命令
```bash
curl -X GET "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/runs/page?limit=50" \
  -H "Authorization: Bearer <token>"
```
