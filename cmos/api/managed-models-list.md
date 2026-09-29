# 获取受管模型列表

## 接口地址

请求方法是`GET`。

完整路径是`/api/managed-models`。

网关端口是8001。

完整地址是`http://localhost:8001/api/managed-models`。

本接口没有路径参数。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT不携带管理员能力。

本接口是管理员专属接口。

非管理员调用返回403。

错误信息是`Admin privileges are required to manage shared models.`。

凭据永远不会离开服务器。

响应不包含API密钥。

## 请求入参

本接口没有请求参数。

本接口没有请求体。

请求示例。

```
GET /api/managed-models HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`_catalog`返回值推导。

- `models`：模型数组。包含config.yaml来源的模型和受管存储中的模型。

`models`数组中config.yaml来源的元素包含以下字段。

- `name`：模型名称。
- `display_name`：显示名称。未配置时回退为`name`。
- `model`：实际提供商模型标识。
- `source`：来源。固定为`config`。
- `enabled`：是否启用。固定为`true`。

`models`数组中受管存储来源的元素包含该模型的公开字段。

公开字段来自源码`ManagedModel.public()`推导。

- `name`：模型名称。
- `display_name`：显示名称。
- `model`：实际提供商模型标识。
- `source`：来源。为受管来源。
- `enabled`：是否启用。布尔值。
- `conflict`：名称是否与config.yaml中的模型冲突。布尔值。

受管模型存储不可用时返回503。

错误信息是`Managed model storage is unavailable; check the catalog and encryption key`。

响应示例来自源码响应模型推导。

```json
{
  "models": [
    {
      "name": "gpt-4",
      "display_name": "GPT-4",
      "model": "gpt-4",
      "source": "config",
      "enabled": true
    },
    {
      "name": "shared-deepseek",
      "display_name": "Shared DeepSeek",
      "model": "deepseek-chat",
      "source": "managed",
      "enabled": true,
      "conflict": false
    }
  ]
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/managed-models
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" http://localhost:8001/api/managed-models
```
