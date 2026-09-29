# 获取记忆数据

## 接口地址

请求方法是`GET`。

完整路径是`/api/memory`。

网关端口是8001。

完整地址是`http://localhost:8001/api/memory`。

本接口没有路径参数。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`memory:read`权限。

IM通道内部调用时会读取绑定属主的记忆。

浏览器和API调用者读取自己的有效用户记忆。

## 请求入参

本接口没有请求参数。

本接口没有请求体。

请求示例。

```
GET /api/memory HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

`null`字段会被省略。

响应字段来自源码`MemoryResponse`模型推导。

- `version`：记忆schema版本。默认`1.0`。
- `revision`：清单修订号。可为`null`。
- `lastUpdated`：最后更新时间戳。默认空字符串。
- `user`：用户上下文。是一个对象。
- `history`：历史上下文。是一个对象。
- `facts`：记忆事实数组。

`user`对象包含以下字段。字段来自源码`UserContext`模型推导。

- `workContext`：工作上下文。是一个对象。
- `personalContext`：个人上下文。是一个对象。
- `topOfMind`：当前关注点。是一个对象。
- `cognitiveStyle`：稳定的思考和协作习惯。是一个对象。

每个上下文对象的字段来自源码`ContextSection`模型推导。

- `summary`：摘要内容。默认空字符串。
- `updatedAt`：更新时间戳。默认空字符串。

`history`对象包含以下字段。字段来自源码`HistoryContext`模型推导。

- `recentMonths`：最近几个月的上下文。
- `earlierContext`：更早的上下文。
- `longTermBackground`：长期背景。

`facts`数组中每个元素的字段来自源码`Fact`模型推导。

- `id`：事实唯一标识。
- `content`：事实内容。
- `category`：事实分类。默认`context`。
- `categoryExtension`：分类为`other`时的扩展分类。可为`null`。
- `topics`：面向检索的主题标签。可为`null`。
- `confidence`：置信度。0到1。默认0.5。
- `createdAt`：创建时间戳。默认空字符串。
- `source`：来源字符串。默认`unknown`。
- `sourceError`：可选的既往错误描述。可为`null`。
- `schemaVersion`：每条事实的schema版本。可为`null`。
- `status`：事实生命周期状态。可为`null`。
- `scope`：规范化的用户/代理范围。可为`null`。
- `revision`：事实乐观锁修订号。可为`null`。
- `updatedAt`：最后更新时间戳。可为`null`。
- `consolidatedAt`：合并时间戳。可为`null`。
- `consolidatedFrom`：合并来源列表。可为`null`。

响应示例来自源码响应模型推导。

```json
{
  "version": "1.0",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "user": {
    "workContext": {"summary": "Working on DeerFlow project", "updatedAt": "2024-01-15T10:30:00Z"},
    "personalContext": {"summary": "Prefers concise responses", "updatedAt": "2024-01-15T10:30:00Z"},
    "topOfMind": {"summary": "Building memory API", "updatedAt": "2024-01-15T10:30:00Z"},
    "cognitiveStyle": {"summary": "", "updatedAt": ""}
  },
  "history": {
    "recentMonths": {"summary": "Recent development activities", "updatedAt": "2024-01-15T10:30:00Z"},
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
      "source": "thread_xyz"
    }
  ]
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/memory
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" http://localhost:8001/api/memory
```
