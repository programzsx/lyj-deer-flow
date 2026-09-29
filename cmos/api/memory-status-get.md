# 获取记忆状态

## 接口地址

请求方法是`GET`。

完整路径是`/api/memory/status`。

网关端口是8001。

完整地址是`http://localhost:8001/api/memory/status`。

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
GET /api/memory/status HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

`null`字段会被省略。

响应字段来自源码`MemoryStatusResponse`模型推导。

- `config`：记忆配置。是一个对象。
- `data`：当前记忆数据。是一个对象。

`config`对象的字段来自源码`MemoryConfigResponse`模型推导。

- `enabled`：记忆机制是否启用。布尔值。
- `mode`：记忆操作模式。取值是`middleware`、`tool`之一。
- `injection_enabled`：记忆是否注入系统提示。布尔值。
- `shutdown_flush_timeout_seconds`：关闭时排空记忆更新的硬预算秒数。
- `manager_class`：当前记忆后端选择器。
- `backend_config`：后端私有配置。是一个字典。

`data`对象的字段来自源码`MemoryResponse`模型推导。

- `version`：记忆schema版本。默认`1.0`。
- `revision`：清单修订号。可为`null`。
- `lastUpdated`：最后更新时间戳。默认空字符串。
- `user`：用户上下文。包含`workContext`、`personalContext`、`topOfMind`、`cognitiveStyle`。
- `history`：历史上下文。包含`recentMonths`、`earlierContext`、`longTermBackground`。
- `facts`：记忆事实数组。

本接口在单次请求中同时返回配置和数据。

响应示例来自源码响应模型推导。

```json
{
  "config": {
    "enabled": true,
    "mode": "middleware",
    "injection_enabled": true,
    "shutdown_flush_timeout_seconds": 30.0,
    "manager_class": "deermem",
    "backend_config": {"max_facts": 100}
  },
  "data": {
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
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/memory/status
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" http://localhost:8001/api/memory/status
```
