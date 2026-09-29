# 获取模型详情

## 接口地址

请求方法是`GET`。

完整路径是`/api/models/{model_name}`。

网关端口是8001。

完整地址是`http://localhost:8001/api/models/{model_name}`。

路径参数`model_name`是模型的唯一标识。

模型不存在时返回404。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口不要求管理员权限。

开启授权（`authorization.enabled`）后需要`model:use`权限。

角色无权使用该模型时返回403。

原因是模型存在但角色缺少使用权限。

授权提供方出错时按`fail_closed`配置返回403或放行。

## 请求入参

本接口有1个路径参数。

- `model_name`：要查询的模型唯一标识。必填。字符串。例如`gpt-4`。

本接口没有请求体。

请求示例。

```
GET /api/models/gpt-4 HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`ModelResponse`模型推导。

- `name`：模型的唯一标识。
- `model`：实际提供商模型标识。
- `display_name`：人类可读名称。可为`null`。
- `description`：模型描述。可为`null`。
- `supports_thinking`：是否支持思考模式。布尔值。该字段已废弃。取值从`reasoning`推导。默认`false`。
- `supports_reasoning_effort`：是否支持推理力度。布尔值。该字段已废弃。取值从`reasoning`推导。默认`false`。
- `reasoning`：规范化推理能力契约。是一个对象。

`reasoning`对象的字段来自源码`ReasoningCapabilitiesResponse`模型推导。

- `thinking`：思考模式可用性。取值是`unsupported`、`optional`、`required`之一。
- `effort`：推理力度控制。可为`null`。
- `history`：推理历史要求。取值是`preserve`、`clear`。可为`null`。
- `source`：契约来源。取值是`legacy`、`contract`之一。

`effort`对象包含以下字段。字段来自源码`ReasoningEffortCapabilitiesResponse`模型推导。

- `values`：模型接受的力度值。字符串数组。按显示顺序排列。
- `default`：调用者不选择时应用的力度。可为`null`。
- `aliases`：DeerFlow通用值到提供商值的映射字典。

响应示例来自源码响应模型推导。

```json
{
  "name": "gpt-4",
  "model": "gpt-4",
  "display_name": "GPT-4",
  "description": "OpenAI GPT-4 model",
  "supports_thinking": false,
  "supports_reasoning_effort": false,
  "reasoning": {"thinking": "unsupported", "effort": null, "history": null, "source": "legacy"}
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/models/gpt-4
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" http://localhost:8001/api/models/gpt-4
```
