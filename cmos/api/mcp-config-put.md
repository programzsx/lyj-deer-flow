# 更新MCP配置

## 接口地址

请求方法是`PUT`。

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

请求体字段来自源码`McpConfigUpdateRequest`模型。

- `mcp_servers`：MCP服务器配置字典。必填。键是服务器名称。值是服务器配置。

本接口是批量更新接口。

写入的配置会与磁盘上的原始配置合并。

掩码值`***`会被替换为已存储的原值。

`env`中的`$VAR`占位符会被保留。

合并后的配置会保存到`extensions_config.json`。

保存后会重载配置缓存并重置MCP工具缓存。

配置无效时返回400。

写入失败时返回500。

服务器配置对象的主要字段来自源码`McpServerConfigResponse`模型。

- `enabled`：是否启用。可选。布尔值。默认`true`。
- `type`：传输类型。可选。取值是`stdio`、`sse`、`http`之一。默认`stdio`。
- `command`：stdio类型的启动命令。可选。
- `args`：stdio类型的命令参数。可选。字符串数组。
- `env`：环境变量。可选。字典。
- `url`：sse或http类型的服务器地址。可选。
- `headers`：HTTP头。可选。字典。
- `description`：服务器描述。可选。

请求示例。

```json
{
  "mcp_servers": {
    "github": {
      "enabled": true,
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {"GITHUB_TOKEN": "$GITHUB_TOKEN"},
      "description": "GitHub MCP server for repository operations"
    }
  }
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
      "enabled": true,
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {"GITHUB_TOKEN": "***"},
      "url": null,
      "headers": {},
      "oauth": null,
      "user_auth": null,
      "headers_from_context": null,
      "description": "GitHub MCP server for repository operations",
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
curl -X PUT -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"mcp_servers":{"github":{"enabled":true,"command":"npx","args":["-y","@modelcontextprotocol/server-github"],"env":{"GITHUB_TOKEN":"$GITHUB_TOKEN"},"description":"GitHub MCP server"}}}' http://localhost:8001/api/mcp/config
```

也可以使用会话Cookie。

```bash
curl -X PUT -b "access_token=<token>" -H "Content-Type: application/json" -d '{"mcp_servers":{"github":{"enabled":true,"command":"npx","args":["-y","@modelcontextprotocol/server-github"],"env":{"GITHUB_TOKEN":"$GITHUB_TOKEN"},"description":"GitHub MCP server"}}}' http://localhost:8001/api/mcp/config
```
