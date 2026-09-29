# 获取线程检查点历史

## 接口地址

接口地址是`POST /api/threads/{thread_id}/history`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/history`。
路径参数`thread_id`是线程ID。线程ID匹配`^[A-Za-z0-9_-]{1,64}$`。

## 接口鉴权
这个接口需要登录。
认证方式支持两种。
第一种是session cookie的`access_token`。
第二种是PAT的`Authorization: Bearer dfp_...`。
需要的权限是`threads:read`。
这个接口要求调用者是线程的所有者。
token来源是`POST /api/v1/auth/login/local`。
用session cookie发起POST请求时需要携带`X-CSRF-Token`头。
用PAT认证可以跳过CSRF校验。

## 请求入参
请求体来自`ThreadHistoryRequest`模型。
- `limit`：整数。最大条目数。取值范围是1到100。默认10。
- `before`：字符串或null。分页游标。传入检查点ID表示从它之前开始。默认null。

请求示例JSON。
```json
{
  "limit": 10,
  "before": null
}
```

## 响应出参
响应体是一个数组。每个元素来自`HistoryEntry`模型。返回线程的物化图状态历史。
只有最新的第一个检查点携带`messages`键。这样避免把完整对话在每个条目里重复。
响应示例来自源码响应模型推导。
- `checkpoint_id`：字符串。检查点ID。
- `parent_checkpoint_id`：字符串或null。父检查点ID。
- `metadata`：对象。检查点元数据。LangGraph内部键会被剥离。保留`step`用于排序。
- `values`：对象。物化值。第一个检查点包含`messages`。还包含`title`和`thread_data`。
- `created_at`：字符串或null。检查点时间。
- `next`：字符串数组。下一个要执行的任务。

`messages`里的AI消息会带`run_id`。最后一条AI消息会带`additional_kwargs.turn_duration`。消息会带`additional_kwargs.deerflow_seq`序号戳。
响应示例。
```json
[
  {
    "checkpoint_id": "1f0f1e0d-2c3b-4a5f-8e9d-0a1b2c3d4e5f",
    "parent_checkpoint_id": "0e9d8c7b-6a5f-4e3d-8c9b-0a1b2c3d4e5f",
    "metadata": {"step": 4},
    "values": {
      "messages": [
        {
          "type": "human",
          "content": "帮我总结这份文档",
          "additional_kwargs": {
            "run_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
            "deerflow_seq": 1
          }
        },
        {
          "type": "ai",
          "content": "好的，总结如下。",
          "id": "ai-msg-001",
          "run_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          "additional_kwargs": {
            "turn_duration": 5,
            "deerflow_seq": 2
          }
        }
      ],
      "title": "文档总结"
    },
    "created_at": "2026-09-29T08:00:05+00:00",
    "next": []
  }
]
```

## curl命令
```bash
curl -X POST "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/history" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```
