# 获取线程最新状态

## 接口地址

接口地址是`GET /api/threads/{thread_id}/state`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/state`。
路径参数`thread_id`是线程ID。线程ID匹配`^[A-Za-z0-9_-]{1,64}$`。

## 接口鉴权
这个接口需要登录。
认证方式支持两种。
第一种是session cookie的`access_token`。
第二种是PAT的`Authorization: Bearer dfp_...`。
需要的权限是`threads:read`。
这个接口要求调用者是线程的所有者。
token来源是`POST /api/v1/auth/login/local`。
GET请求不需要CSRF头。
线程没有检查点时返回404。

## 请求入参
这个接口没有请求体。
- `thread_id`：字符串。线程ID。

## 响应出参
响应体来自`ThreadStateResponse`模型。返回线程最新的物化图状态。响应示例来自源码响应模型推导。
- `values`：对象。当前通道值。`messages`会带`additional_kwargs.deerflow_seq`序号戳。
- `next`：字符串数组。下一个要执行的任务。
- `metadata`：对象。检查点元数据。
- `checkpoint`：对象。检查点信息。包含`id`和`ts`。
- `checkpoint_id`：字符串。当前检查点ID。
- `parent_checkpoint_id`：字符串或null。父检查点ID。
- `created_at`：字符串或null。检查点时间。
- `tasks`：数组。被中断任务的详情。每个元素包含`id`和`name`。

响应示例。
```json
{
  "values": {
    "messages": [
      {
        "type": "human",
        "content": "帮我总结这份文档",
        "additional_kwargs": {
          "deerflow_seq": 1
        }
      },
      {
        "type": "ai",
        "content": "好的，总结如下。",
        "additional_kwargs": {
          "deerflow_seq": 2
        }
      }
    ],
    "title": "文档总结"
  },
  "next": [],
  "metadata": {},
  "checkpoint": {
    "id": "1f0f1e0d-2c3b-4a5f-8e9d-0a1b2c3d4e5f",
    "ts": "2026-09-29T08:00:05+00:00"
  },
  "checkpoint_id": "1f0f1e0d-2c3b-4a5f-8e9d-0a1b2c3d4e5f",
  "parent_checkpoint_id": null,
  "created_at": "2026-09-29T08:00:05+00:00",
  "tasks": []
}
```

## curl命令
```bash
curl -X GET "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/state" \
  -H "Authorization: Bearer <token>"
```
