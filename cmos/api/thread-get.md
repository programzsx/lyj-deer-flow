# 获取线程详情

## 接口地址

接口地址是`GET /api/threads/{thread_id}`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}`。
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
线程不存在时返回404。

## 请求入参
这个接口没有请求体。
- `thread_id`：字符串。线程ID。

## 响应出参
响应体来自`ThreadResponse`模型。响应来自元数据加图的物化状态。响应示例来自源码响应模型推导。
- `thread_id`：字符串。线程ID。
- `status`：字符串。线程状态。取值是`idle`、`busy`、`interrupted`、`error`。状态由检查点快照和原始pending writes推导。
- `created_at`：字符串。创建时间。ISO时间戳。
- `updated_at`：字符串。更新时间。ISO时间戳。
- `metadata`：对象。线程元数据。敏感项会被脱敏。
- `values`：对象。当前状态通道值。典型键是`messages`、`title`等。
- `interrupts`：对象。待处理中断。

响应示例。
```json
{
  "thread_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "status": "idle",
  "created_at": "2026-09-29T08:00:00+00:00",
  "updated_at": "2026-09-29T08:00:05+00:00",
  "metadata": {},
  "values": {
    "messages": [
      {"type": "human", "content": "帮我总结这份文档"},
      {"type": "ai", "content": "好的，总结如下。"}
    ],
    "title": "文档总结"
  },
  "interrupts": {}
}
```

## curl命令
```bash
curl -X GET "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479" \
  -H "Authorization: Bearer <token>"
```
