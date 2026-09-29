# 删除个人MCP服务器

## 接口地址

请求方法是`DELETE`。

完整路径是`/api/mcp/personal/config/servers/{server_name:path}`。

网关端口是8001。

完整地址是`http://localhost:8001/api/mcp/personal/config/servers/{server_name:path}`。

路径参数`server_name`是要删除的MCP服务器名称。

`:path`表示该参数可以包含斜杠。

服务器名称不存在时返回404。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口是属主专属接口。

每个用户只能删除自己的个人MCP服务器。

本接口不需要管理员权限。

## 请求入参

本接口有1个路径参数。

- `server_name`：要删除的服务器名称。必填。字符串。

本接口没有请求体。

请求示例。

```
DELETE /api/mcp/personal/config/servers/github HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`McpConfigResponse`模型推导。

- `mcp_servers`：删除后剩余的个人MCP服务器配置字典。键是服务器名称。值是配置对象。敏感字段被掩码为`***`。

响应示例来自源码响应模型推导。

```json
{
  "mcp_servers": {
    "search": {
      "enabled": true,
      "type": "http",
      "command": null,
      "args": [],
      "env": {},
      "url": "https://mcp.example.com/search",
      "headers": {},
      "oauth": null,
      "user_auth": null,
      "headers_from_context": null,
      "description": "Search MCP server",
      "routing": {},
      "tools": {},
      "tool_name_prefix": true,
      "tool_call_timeout": null,
      "session_init_timeout": 30.0,
      "task_toolsets": []
    }
  }
}
```

## curl命令

```bash
curl -X DELETE -H "Authorization: Bearer <token>" http://localhost:8001/api/mcp/personal/config/servers/github
```

也可以使用会话Cookie。

```bash
curl -X DELETE -b "access_token=<token>" http://localhost:8001/api/mcp/personal/config/servers/github
```
