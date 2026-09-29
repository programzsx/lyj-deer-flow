# 安装能力

## 接口地址

请求方法是`POST`。

完整路径是`/api/capabilities/installations`。

网关端口是8001。

完整地址是`http://localhost:8001/api/capabilities/installations`。

本接口没有路径参数。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

权限取决于安装范围。

`scope`为`deployment`时要求管理员权限。

非管理员调用返回403。

`scope`为`user`时任何已认证用户都可以安装。

但用户级安装有限制。

只有`mcp`和`business`两类适配器允许用户级安装。

其他适配器的用户级安装会回退到管理员校验。

非管理员调用返回403。

## 请求入参

本接口的请求体是一个JSON对象。

请求体字段来自源码`InstallRequest`模型。

未知字段会被拒绝。

- `plugin_id`：要安装的能力ID。必填。字符串。必须与能力目录中的`id`匹配。目录中没有该ID时返回404。
- `name`：安装显示名称。可选。字符串。最大长度128。默认空字符串。
- `configuration`：能力配置。可选。对象。默认空对象。
- `scope`：安装范围。可选。取值是`deployment`、`user`之一。默认是`deployment`。

请求示例。

```json
{
  "plugin_id": "github",
  "name": "My GitHub",
  "configuration": {"token": "ghp_xxx"},
  "scope": "user"
}
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`InstallationList`模型推导。

- `items`：安装条目数组。只包含本次安装适配器的安装记录。
- `can_manage`：当前用户是否可以管理这些安装。布尔值。

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
      "id": "github-user-1",
      "plugin_id": "github",
      "adapter": "mcp",
      "name": "My GitHub",
      "description": "",
      "selectable": true,
      "installed": true,
      "enabled": true,
      "version": "1.0.0",
      "scope": "user",
      "auth_status": "unknown",
      "health": "unknown",
      "reference": "user-config#github-user-1",
      "category": "development",
      "icon": null
    }
  ],
  "can_manage": false
}
```

## curl命令

```bash
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"plugin_id":"github","name":"My GitHub","configuration":{},"scope":"user"}' http://localhost:8001/api/capabilities/installations
```

也可以使用会话Cookie。

```bash
curl -X POST -b "access_token=<token>" -H "Content-Type: application/json" -d '{"plugin_id":"github","name":"My GitHub","configuration":{},"scope":"user"}' http://localhost:8001/api/capabilities/installations
```
