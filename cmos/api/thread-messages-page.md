# 分页列出线程消息

## 接口地址

接口地址是`GET /api/threads/{thread_id}/messages/page`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/messages/page`。
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
- `before_seq`：整数或null。游标。只返回序号小于这个值的行。最小值1。默认null。

这个接口只支持向后翻页。携带`after_seq`会返回422。

## 响应出参
响应体来自`ThreadMessagesPageResponse`模型。按线程全局事件序号向后分页。
响应示例来自源码响应模型推导。
- `data`：数组。消息行列表。每行附有运行级耗时和反馈。只有每条运行最后一条可见AI消息会附带反馈。
- `has_more`：布尔值。是否还有更早的页。
- `next_before_seq`：整数或null。下一页游标。没有下一页时是null。

每行字段如下。
- `seq`：整数。线程全局事件序号。
- `run_id`：字符串。所属运行ID。
- `event_type`：字符串。事件类型。
- `category`：字符串。事件类别。
- `content`：消息内容。
- `metadata`：对象。事件元数据。
- `created_at`：字符串。创建时间。
- `feedback`：对象或null。反馈。包含`feedback_id`、`rating`、`comment`。

响应示例。
```json
{
  "data": [
    {
      "seq": 2,
      "run_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "event_type": "llm.ai.response",
      "category": "message",
      "content": {"type": "ai", "content": "好的，总结如下。"},
      "metadata": {},
      "created_at": "2026-09-29T08:00:05+00:00",
      "feedback": null,
      "additional_kwargs": {
        "turn_duration": 5
      }
    },
    {
      "seq": 1,
      "run_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "event_type": "human_message",
      "category": "message",
      "content": {"type": "human", "content": "帮我总结这份文档"},
      "metadata": {},
      "created_at": "2026-09-29T08:00:00+00:00",
      "feedback": null
    }
  ],
  "has_more": false,
  "next_before_seq": null
}
```

## curl命令
```bash
curl -X GET "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/messages/page?limit=50" \
  -H "Authorization: Bearer <token>"
```
