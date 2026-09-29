# 替换单个个人MCP服务器

## 接口地址

请求方法是`PUT`。

完整路径是`/api/mcp/personal/config/server`。

网关端口是8001。

完整地址是`http://localhost:8001/api/mcp/personal/config/server`。

本接口没有路径参数。

服务器名称放在请求体中。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口是属主专属接口。

每个用户只能替换自己的个人MCP服务器。

本接口不需要管理员权限。

普通用户同样受配置限制。

普通用户只能配置http或sse类型的公开HTTP(S)端点。

普通用户不能配置OAuth令牌端点。

普通用户配置host命令时只有捆绑连接被允许。

违规时返回403或400。

## 请求入参

本接口的请求体是一个JSON对象。

请求体字段来自源码`McpServerConfigUpdateRequest`模型。

- `server_name`：要替换的服务器名称。必填。字符串。服务器不存在时返回404。
- `server`：完整的替换配置。必填。对象。省略的普通字段会被重置。

服务器配置对象的主要字段来自源码`McpServerConfigResponse`模型。

- `enabled`：是否启用。可选。布尔值。默认`true`。
- `type`：传输类型。可选。取值是`stdio`、`sse`、`http`之一。默认`stdio`。
- `command`：stdio类型的启动命令。可选。
- `args`：stdio类型的命令参数。可选。字符串数组。
- `env`：环境变量。可选。字典。掩码值`***`会被替换为已存储的原值。
- `url`：sse或http类型的服务器地址。可选。
- `headers`：HTTP头。可选。字典。
- `description`：服务器描述。可选。

配置无效时返回400。

请求示例。

```json
{
  "server_name": "github",
  "server": {
    "enabled": true,
    "type": "http",
    "url": "https://mcp.example.com/github-v2",
    "description": "Updated endpoint"
  }
}
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`McpConfigResponse`模型推导。

- `mcp_servers`：替换后的个人MCP服务器配置字典。键是服务器名称。值是配置对象。敏感字段被掩码为`***`。

响应示例来自源码响应模型推导。

```json
{
  "mcp_servers": {
    "github": {
      "enabled": true,
      "type": "http",
      "command": null,
      "args": [],
      "env": {},
      "url": "https://mcp.example.com/github-v2",
      "headers": {},
      "oauth": null,
      "user_auth": null,
      "headers_from_context": null,
      "description": "Updated endpoint",
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
curl -X PUT -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"server_name":"github","server":{"enabled":true,"type":"http","url":"https://mcp.example.com/github-v2","description":"Updated endpoint"}}' http://localhost:8001/api/mcp/personal/config/server
```

也可以使用会话Cookie。

```bash
curl -X PUT -b "access_token=<token>" -H "Content-Type: application/json" -d '{"server_name":"github","server":{"enabled":true,"type":"http","url":"https://mcp.example.com/github-v2","description":"Updated endpoint"}}' http://localhost:8001/api/mcp/personal/config/server
```
