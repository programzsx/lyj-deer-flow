# 导入记忆数据

## 接口地址

请求方法是`POST`。

完整路径是`/api/memory/import`。

网关端口是8001。

完整地址是`http://localhost:8001/api/memory/import`。

本接口没有路径参数。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`memory:write`权限。

## 请求入参

本接口的请求体是一个JSON对象。

请求体格式与源码`MemoryResponse`模型一致。

请求体内容会整体覆盖当前记忆数据。

- `version`：记忆schema版本。可选。默认`1.0`。
- `revision`：清单修订号。可选。
- `lastUpdated`：最后更新时间戳。可选。
- `user`：用户上下文。可选。是一个对象。
- `history`：历史上下文。可选。是一个对象。
- `facts`：记忆事实数组。可选。必须是对象数组。每个事实必须有非空`content`。

非法的导入内容返回400。

错误信息是`Invalid memory import: facts must be a list of objects with non-empty content.`。

后端不支持导入操作时返回501。

并发冲突时返回409。

存储失败时返回500。

请求示例。

```json
{
  "version": "1.0",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "user": {
    "workContext": {"summary": "Working on DeerFlow project", "updatedAt": "2024-01-15T10:30:00Z"},
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
      "content": "User prefers TypeScript over JavaScript",
      "category": "preference",
      "confidence": 0.9,
      "createdAt": "2024-01-15T10:30:00Z",
      "source": "unknown"
    }
  ]
}
```

## 响应出参

响应是一个JSON对象。

`null`字段会被省略。

响应字段来自源码`MemoryResponse`模型推导。

- `version`：导入后的记忆schema版本。默认`1.0`。
- `revision`：清单修订号。可为`null`。
- `lastUpdated`：最后更新时间戳。默认空字符串。
- `user`：用户上下文。是一个对象。包含`workContext`、`personalContext`、`topOfMind`、`cognitiveStyle`。
- `history`：历史上下文。是一个对象。包含`recentMonths`、`earlierContext`、`longTermBackground`。
- `facts`：导入后的记忆事实数组。每个元素包含`id`、`content`、`category`、`confidence`、`createdAt`、`source`等字段。

响应示例来自源码响应模型推导。

```json
{
  "version": "1.0",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "user": {
    "workContext": {"summary": "Working on DeerFlow project", "updatedAt": "2024-01-15T10:30:00Z"},
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
      "content": "User prefers TypeScript over JavaScript",
      "category": "preference",
      "confidence": 0.9,
      "createdAt": "2024-01-15T10:30:00Z",
      "source": "unknown"
    }
  ]
}
```

## curl命令

```bash
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"version":"1.0","user":{"workContext":{"summary":"","updatedAt":""},"personalContext":{"summary":"","updatedAt":""},"topOfMind":{"summary":"","updatedAt":""},"cognitiveStyle":{"summary":"","updatedAt":""}},"history":{"recentMonths":{"summary":"","updatedAt":""},"earlierContext":{"summary":"","updatedAt":""},"longTermBackground":{"summary":"","updatedAt":""}},"facts":[]}' http://localhost:8001/api/memory/import
```

也可以使用会话Cookie。

```bash
curl -X POST -b "access_token=<token>" -H "Content-Type: application/json" -d '{"version":"1.0","user":{"workContext":{"summary":"","updatedAt":""},"personalContext":{"summary":"","updatedAt":""},"topOfMind":{"summary":"","updatedAt":""},"cognitiveStyle":{"summary":"","updatedAt":""}},"history":{"recentMonths":{"summary":"","updatedAt":""},"earlierContext":{"summary":"","updatedAt":""},"longTermBackground":{"summary":"","updatedAt":""}},"facts":[]}' http://localhost:8001/api/memory/import
```
