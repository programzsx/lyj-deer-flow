# 更新MCP服务器启用状态

## 接口地址

请求方法是`PATCH`。

完整路径是`/api/mcp/config`。

网关端口是8001。

完整地址是`http://localhost:8001/api/mcp/config`。

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

本接口的请求体是一个JSON对象。

请求体字段来自源码`McpServerStateUpdateRequest`模型。

- `server_name`：要更新的服务器名称。必填。字符串。服务器不存在时返回404。
- `enabled`：是否启用。必填。布尔值。`true`表示启用。`false`表示禁用。

本接口只切换一个服务器的启用状态。

本接口不会替换完整配置。

启用服务器时会先校验该服务器的完整配置。

配置无效时启用请求返回400。

写入后配置会重载并重置MCP工具缓存。

请求示例。

```json
{
  "server_name": "github",
  "enabled": false
}
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`McpConfigResponse`模型推导。

- `mcp_servers`：更新后的MCP服务器配置字典。键是服务器名称。值是配置对象。敏感字段被掩码为`***`。

响应示例来自源码响应模型推导。

```json
{
  "mcp_servers": {
    "github": {
      "enabled": false,
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {"GITHUB_TOKEN": "***"},
      "url": null,
      "headers": {},
      "oauth": null,
      "user_auth": null,
      "headers_from_context": null,
      "description": "GitHub MCP server",
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
curl -X PATCH -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"server_name":"github","enabled":false}' http://localhost:8001/api/mcp/config
```

也可以使用会话Cookie。

```bash
curl -X PATCH -b "access_token=<token>" -H "Content-Type: application/json" -d '{"server_name":"github","enabled":false}' http://localhost:8001/api/mcp/config
```
