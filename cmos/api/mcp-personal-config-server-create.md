# 添加个人MCP服务器

## 接口地址

请求方法是`POST`。

完整路径是`/api/mcp/personal/config/servers`。

网关端口是8001。

完整地址是`http://localhost:8001/api/mcp/personal/config/servers`。

本接口没有路径参数。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口是属主专属接口。

每个用户只能写入自己的个人MCP配置。

本接口不需要管理员权限。

但普通用户的配置受限制。

普通用户只能配置http或sse类型的公开HTTP(S)端点。

普通用户不能配置OAuth令牌端点。

普通用户配置host命令时只有捆绑连接被允许。

管理员不受这些限制。

违规时返回403或400。

## 请求入参

本接口的请求体是一个JSON对象。

请求体字段来自源码`McpConfigUpdateRequest`模型。

- `mcp_servers`：要添加的MCP服务器字典。必填。键是服务器名称。值是服务器配置。

服务器配置对象的主要字段来自源码`McpServerConfigResponse`模型。

- `enabled`：是否启用。可选。布尔值。默认`true`。
- `type`：传输类型。可选。取值是`stdio`、`sse`、`http`之一。默认`stdio`。
- `command`：stdio类型的启动命令。可选。
- `args`：stdio类型的命令参数。可选。字符串数组。
- `env`：环境变量。可选。字典。
- `url`：sse或http类型的服务器地址。可选。
- `headers`：HTTP头。可选。字典。
- `description`：服务器描述。可选。
- `tool_name_prefix`：是否给工具名加前缀。可选。布尔值。

服务器名已存在时返回409。

服务器配置含掩码值`***`时返回400。

配置无效时返回400。

请求示例。

```json
{
  "mcp_servers": {
    "github": {
      "enabled": true,
      "type": "http",
      "url": "https://mcp.example.com/github",
      "description": "My personal GitHub MCP"
    }
  }
}
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`McpConfigResponse`模型推导。

- `mcp_servers`：写入后的个人MCP服务器配置字典。键是服务器名称。值是配置对象。敏感字段被掩码为`***`。

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
      "url": "https://mcp.example.com/github",
      "headers": {},
      "oauth": null,
      "user_auth": null,
      "headers_from_context": null,
      "description": "My personal GitHub MCP",
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
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"mcp_servers":{"github":{"enabled":true,"type":"http","url":"https://mcp.example.com/github","description":"My personal GitHub MCP"}}}' http://localhost:8001/api/mcp/personal/config/servers
```

也可以使用会话Cookie。

```bash
curl -X POST -b "access_token=<token>" -H "Content-Type: application/json" -d '{"mcp_servers":{"github":{"enabled":true,"type":"http","url":"https://mcp.example.com/github","description":"My personal GitHub MCP"}}}' http://localhost:8001/api/mcp/personal/config/servers
```
