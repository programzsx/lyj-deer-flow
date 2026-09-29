# 获取个人MCP配置

## 接口地址

请求方法是`GET`。

完整路径是`/api/mcp/personal/config`。

网关端口是8001。

完整地址是`http://localhost:8001/api/mcp/personal/config`。

本接口没有路径参数。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口是属主专属接口。

每个用户只能读取自己的个人MCP配置。

普通用户也可以调用本接口。

本接口不需要管理员权限。

个人MCP配置使用属主自己的文件。

部署级MCP配置是另一组路由。

部署级MCP路由是管理员专属。

## 请求入参

本接口没有请求参数。

本接口没有请求体。

请求示例。

```
GET /api/mcp/personal/config HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`McpConfigResponse`模型推导。

- `mcp_servers`：MCP服务器配置字典。键是服务器名称。值是该服务器的配置对象。

`mcp_servers`字典中每个值来自源码`McpServerConfigResponse`模型推导。敏感字段会被掩码为`***`。

- `enabled`：是否启用。布尔值。默认`true`。
- `type`：传输类型。取值是`stdio`、`sse`、`http`之一。默认`stdio`。
- `command`：stdio类型的启动命令。可为`null`。
- `args`：stdio类型的命令参数。字符串数组。
- `env`：环境变量字典。敏感值显示为`***`。
- `url`：sse或http类型的服务器地址。可为`null`。
- `headers`：sse或http类型发送的HTTP头。字典。
- `oauth`：OAuth配置。可为`null`。
- `user_auth`：每用户凭据注入配置。可为`null`。
- `headers_from_context`：每请求凭据注入配置。可为`null`。
- `description`：服务器描述。默认空字符串。
- `routing`：工具软路由提示配置。
- `tools`：按工具的配置覆盖。字典。
- `tool_name_prefix`：是否给发现的工具名加服务器名前缀。布尔值。默认`true`。
- `tool_call_timeout`：单次调用超时秒数。可为`null`。
- `session_init_timeout`：服务器启动超时秒数。可为`null`。
- `task_toolsets`：作为后台任务管理的手动工具组。数组。

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
      "headers": {"Authorization": "***"},
      "oauth": null,
      "user_auth": null,
      "headers_from_context": null,
      "description": "Personal GitHub MCP server",
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
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/mcp/personal/config
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" http://localhost:8001/api/mcp/personal/config
```
