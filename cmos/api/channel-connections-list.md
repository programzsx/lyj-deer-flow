# 渠道连接列表接口

## 接口地址

- 请求方法是GET。
- 完整路径是`/api/channels/connections`。
- 网关端口是8001。
- 完整URL是`http://localhost:8001/api/channels/connections`。
- 本接口没有路径参数。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码没有`@require_permission`装饰器。
- 本接口要求登录。未登录时返回401。
- 本接口只返回当前用户的连接。
- PAT Bearer调用会返回403。PAT允许清单不包含本接口。

## 请求入参

- 本接口没有请求体。
- 本接口没有查询参数。

## 响应出参

- 响应是JSON对象。
- 渠道连接功能关闭时返回空数组。
- 响应示例来自源码响应模型推导。

字段说明：

- `connections`：数组。当前用户的连接列表。按更新时间倒序排列。

`connections`数组元素字段说明：

- `id`：字符串。连接ID。
- `provider`：字符串。渠道提供方标识。
- `status`：字符串。连接状态。例如`connected`、`revoked`。
- `external_account_id`：字符串或null。外部账号ID。空值会转为null。
- `external_account_name`：字符串或null。外部账号名称。
- `workspace_id`：字符串或null。外部工作区ID。空值会转为null。
- `workspace_name`：字符串或null。外部工作区名称。
- `scopes`：数组。授权的作用域列表。
- `metadata`：对象。连接的元数据。

响应示例：

```json
{
  "connections": [
    {
      "id": "conn-001",
      "provider": "telegram",
      "status": "connected",
      "external_account_id": "12345678",
      "external_account_name": "Alice",
      "workspace_id": "",
      "workspace_name": null,
      "scopes": ["bot"],
      "metadata": {}
    }
  ]
}
```

## curl命令

```bash
curl -X GET "http://localhost:8001/api/channels/connections" \
  -b "access_token=<token>"
```
