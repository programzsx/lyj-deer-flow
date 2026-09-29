# 部分更新记忆事实

## 接口地址

请求方法是`PATCH`。

完整路径是`/api/memory/facts/{fact_id}`。

网关端口是8001。

完整地址是`http://localhost:8001/api/memory/facts/{fact_id}`。

路径参数`fact_id`是要更新的事实唯一标识。

事实不存在时返回404。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`memory:write`权限。

## 请求入参

本接口的请求体是一个JSON对象。

请求体字段来自源码`FactPatchRequest`模型。

省略的字段会保留现有值。

- `content`：事实内容。可选。字符串。最短长度1。省略时保留原值。
- `category`：事实分类。可选。字符串。省略时保留原值。
- `confidence`：置信度。可选。数字。取值0到1。省略时保留原值。无效值返回400。

后端不支持更新操作时返回501。

并发冲突时返回409。

存储失败时返回500。

请求示例。

```json
{
  "content": "User strongly prefers TypeScript",
  "confidence": 0.95
}
```

## 响应出参

响应是一个JSON对象。

`null`字段会被省略。

响应字段来自源码`MemoryResponse`模型推导。

- `version`：记忆schema版本。默认`1.0`。
- `revision`：清单修订号。可为`null`。
- `lastUpdated`：最后更新时间戳。默认空字符串。
- `user`：用户上下文。是一个对象。包含`workContext`、`personalContext`、`topOfMind`、`cognitiveStyle`。
- `history`：历史上下文。是一个对象。包含`recentMonths`、`earlierContext`、`longTermBackground`。
- `facts`：更新后的记忆事实数组。每个元素包含`id`、`content`、`category`、`confidence`、`createdAt`、`source`、`updatedAt`等字段。

响应示例来自源码响应模型推导。

```json
{
  "version": "1.0",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "user": {
    "workContext": {"summary": "", "updatedAt": ""},
    "personalContext": {"summary": "", "updatedAt": ""},
    "topOfMind": {"summary": "", "updatedAt": ""},
    "cognitiveStyle": {"summary": "", "updatedAt": ""}
  },
  "history": {
    "recentMonths": {"summary": "", "updatedAt": ""},
    "earlierContext": {"summary": "", "updatedAt": ""},
    "longTermBackground": {"summary": "", "updatedAt": ""}
  },
  "facts": [
    {
      "id": "fact_abc123",
      "content": "User strongly prefers TypeScript",
      "category": "preference",
      "confidence": 0.95,
      "createdAt": "2024-01-15T10:30:00Z",
      "source": "unknown"
    }
  ]
}
```

## curl命令

```bash
curl -X PATCH -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"content":"User strongly prefers TypeScript","confidence":0.95}' http://localhost:8001/api/memory/facts/fact_abc123
```

也可以使用会话Cookie。

```bash
curl -X PATCH -b "access_token=<token>" -H "Content-Type: application/json" -d '{"content":"User strongly prefers TypeScript","confidence":0.95}' http://localhost:8001/api/memory/facts/fact_abc123
```
