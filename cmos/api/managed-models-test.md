# 测试受管模型连接

## 接口地址

请求方法是`POST`。

完整路径是`/api/managed-models/test`。

网关端口是8001。

完整地址是`http://localhost:8001/api/managed-models/test`。

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

## 请求入参

本接口的请求体是一个JSON对象。

请求体字段来自源码`SaveModelRequest`模型。

未知字段会被拒绝。

- `config`：要测试的模型配置。必填。对象。格式与受管模型保存配置一致。
- `expected_revision`：期望的修订号。可选。可为`null`。提供时校验存储中的当前修订。

`config`对象的主要字段来自源码`ManagedModel`推导。

- `name`：模型名称。
- `model`：实际提供商模型标识。
- `use`：提供商类路径。
- `api_key`：API密钥。提供`expected_revision`时`null`会沿用已存储的密钥。
- `base_url`：可选的服务地址。
- `display_name`：可选的显示名称。

提供`expected_revision`但模型不存在或修订不匹配时返回409。

错误信息是`Model changed; reload before testing`。

本接口发送一个有界的流式工具调用探测。

本接口不会保存模型配置。

探测超时是20秒。

请求超时是15秒。

无重试。

DeepSeek会强制关闭thinking。

原因是强制工具选择需要。

探测失败时返回`ok`为`false`的结果。

错误信息不会暴露提供商异常内容。

原因是异常字符串可能包含密钥、URL或响应体。

请求示例。

```json
{
  "config": {
    "name": "shared-deepseek",
    "model": "deepseek-chat",
    "api_key": "sk-xxx"
  }
}
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码返回值推导。

- `ok`：连接测试是否成功。布尔值。
- `message`：测试结果消息。取值是`success`、`tool_call_missing`、`connection_failed`之一。

测试成功时`ok`为`true`。`message`为`success`。

模型未按预期返回工具调用时`message`为`tool_call_missing`。

连接失败时`ok`为`false`。`message`为`connection_failed`。

响应示例来自源码响应模型推导。

```json
{
  "ok": true,
  "message": "success"
}
```

测试失败时的响应示例。

```json
{
  "ok": false,
  "message": "connection_failed"
}
```

## curl命令

```bash
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"config":{"name":"shared-deepseek","model":"deepseek-chat","api_key":"sk-xxx"}}' http://localhost:8001/api/managed-models/test
```

也可以使用会话Cookie。

```bash
curl -X POST -b "access_token=<token>" -H "Content-Type: application/json" -d '{"config":{"name":"shared-deepseek","model":"deepseek-chat","api_key":"sk-xxx"}}' http://localhost:8001/api/managed-models/test
```
