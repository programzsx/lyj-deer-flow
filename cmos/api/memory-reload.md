# 重载记忆数据

## 接口地址

请求方法是`POST`。

完整路径是`/api/memory/reload`。

网关端口是8001。

完整地址是`http://localhost:8001/api/memory/reload`。

本接口没有路径参数。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`memory:read`权限。

## 请求入参

本接口没有请求参数。

本接口没有请求体。

请求示例。

```
POST /api/memory/reload HTTP/1.1
Host: localhost:8001
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
- `facts`：记忆事实数组。每个元素包含`id`、`content`、`category`、`confidence`、`createdAt`、`source`等字段。

本接口从存储文件强制重载记忆数据。

本接口会刷新内存缓存。

存储文件被外部修改时本接口有用。

后端不支持重载概念时会降级为读取当前记忆。

并发冲突时返回409。

存储数据损坏时返回500。

后端不支持完整文档时返回501。

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
  "facts": []
}
```

## curl命令

```bash
curl -X POST -H "Authorization: Bearer <token>" http://localhost:8001/api/memory/reload
```

也可以使用会话Cookie。

```bash
curl -X POST -b "access_token=<token>" http://localhost:8001/api/memory/reload
```
