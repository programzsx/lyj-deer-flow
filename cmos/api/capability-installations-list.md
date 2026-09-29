# 获取已安装能力列表

## 接口地址

请求方法是`GET`。

完整路径是`/api/capabilities/installations/{adapter}`。

网关端口是8001。

完整地址是`http://localhost:8001/api/capabilities/installations/{adapter}`。

路径参数`adapter`是能力适配器名称。

常见取值是`mcp`和`business`。

适配器名称决定了从哪个适配器读取安装记录。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

任何已认证用户都可以调用本接口。

本接口不需要管理员权限。

能力发现对所有认证用户公开。

## 请求入参

本接口有1个路径参数。

- `adapter`：能力适配器名称。必填。例如`mcp`。

本接口有1个查询参数。

- `scope`：安装范围。可选。取值是`deployment`、`user`、`all`之一。默认是`deployment`。`deployment`表示部署级安装。`user`表示用户级安装。`all`表示两者都返回。

请求示例。

```
GET /api/capabilities/installations/mcp?scope=all HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`InstallationList`模型推导。

- `items`：安装条目数组。每个元素是一个已安装能力。
- `can_manage`：当前用户是否可以管理这些安装。布尔值。默认`false`。

`items`数组中每个条目的字段来自源码`CapabilityInstallation`模型推导。

- `id`：安装的唯一标识。
- `plugin_id`：对应的能力目录ID。可为`null`。
- `adapter`：适配器名称。
- `name`：安装显示名称。
- `description`：安装描述。
- `selectable`：是否可以在聊天中选择。布尔值。
- `installed`：是否已安装。布尔值。
- `enabled`：是否启用。可为`null`。
- `version`：版本号。可为`null`。
- `scope`：安装范围。`deployment`或`user`。
- `auth_status`：认证状态。默认`unknown`。
- `health`：健康状态。默认`unknown`。
- `reference`：安装引用标识。
- `category`：能力分类。可为`null`。
- `icon`：图标。可为`null`。

响应示例来自源码响应模型推导。

```json
{
  "items": [
    {
      "id": "github-mcp",
      "plugin_id": "github",
      "adapter": "mcp",
      "name": "GitHub MCP",
      "description": "GitHub MCP server",
      "selectable": true,
      "installed": true,
      "enabled": true,
      "version": "1.0.0",
      "scope": "deployment",
      "auth_status": "ok",
      "health": "healthy",
      "reference": "extensions_config.json#github",
      "category": "development",
      "icon": null
    }
  ],
  "can_manage": false
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" "http://localhost:8001/api/capabilities/installations/mcp?scope=all"
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" "http://localhost:8001/api/capabilities/installations/mcp"
```
