# 重置MCP工具缓存

## 接口地址

请求方法是`POST`。

完整路径是`/api/mcp/cache/reset`。

网关端口是8001。

完整地址是`http://localhost:8001/api/mcp/cache/reset`。

本接口没有路径参数。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT不携带管理员能力。

本接口是管理员专属接口。

非管理员调用返回403。

错误信息是`Admin privileges required to manage MCP configuration.`。

## 请求入参

本接口没有请求参数。

本接口没有请求体。

请求示例。

```
POST /api/mcp/cache/reset HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`McpCacheResetResponse`模型推导。

- `success`：缓存是否重置成功。布尔值。
- `message`：人类可读的重置状态消息。字符串。

本接口会重置进程内缓存的MCP工具和持久会话。

重置后下次使用时工具会重新加载。

本接口影响当前Gateway进程中的所有线程和所有用户。

响应示例来自源码响应模型推导。

```json
{
  "success": true,
  "message": "MCP tools cache reset. Tools will reload on next use."
}
```

## curl命令

```bash
curl -X POST -H "Authorization: Bearer <token>" http://localhost:8001/api/mcp/cache/reset
```

也可以使用会话Cookie。

```bash
curl -X POST -b "access_token=<token>" http://localhost:8001/api/mcp/cache/reset
```
