# 列出线程全部消息

## 接口地址

接口地址是`GET /api/threads/{thread_id}/messages`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/messages`。
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
- `limit`：整数。返回条数上限。取值范围是1到200。默认50。
- `before_seq`：整数或null。游标。只返回序号小于这个值的行。最小值1。默认null。
- `after_seq`：整数或null。游标。只返回序号大于这个值的行。最小值1。默认null。

## 响应出参
响应体是一个数组。返回线程跨全部运行的可显示消息。每行附有反馈。
隐藏运行、隐藏消息和中间件标记消息会被过滤。
每条AI运行的最后一条AI消息会附带反馈。每条AI运行的最后一条AI消息会附带`turn_duration`。
每行字段的响应示例来自源码响应模型推导。
- `seq`：整数。线程全局事件序号。
- `run_id`：字符串。所属运行ID。
- `event_type`：字符串。事件类型。AI回复是`llm.ai.response`。
- `category`：字符串。事件类别。消息是`message`。
- `content`：消息内容。可能是对象或消息载荷。
- `metadata`：对象。事件元数据。中间件消息带`caller`。
- `created_at`：字符串。创建时间。
- `feedback`：对象或null。最后一条AI消息附带的反馈。包含`feedback_id`、`rating`、`comment`。没有反馈时是null。
- `additional_kwargs.turn_duration`：整数。最后一条AI消息附带的运行耗时。单位秒。

响应示例。
```json
[
  {
    "seq": 1,
    "run_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "event_type": "human_message",
    "category": "message",
    "content": {"type": "human", "content": "帮我总结这份文档"},
    "metadata": {},
    "created_at": "2026-09-29T08:00:00+00:00",
    "feedback": null
  },
  {
    "seq": 2,
    "run_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "event_type": "llm.ai.response",
    "category": "message",
    "content": {"type": "ai", "content": "好的，总结如下。"},
    "metadata": {},
    "created_at": "2026-09-29T08:00:05+00:00",
    "feedback": {
      "feedback_id": "fb-001",
      "rating": 1,
      "comment": "很有帮助"
    },
    "additional_kwargs": {
      "turn_duration": 5
    }
  }
]
```

## curl命令
```bash
curl -X GET "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/messages?limit=50" \
  -H "Authorization: Bearer <token>"
```
