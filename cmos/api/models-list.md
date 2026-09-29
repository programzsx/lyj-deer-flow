# 获取模型列表

## 接口地址

请求方法是`GET`。

完整路径是`/api/models`。

网关端口是8001。

完整地址是`http://localhost:8001/api/models`。

本接口没有路径参数。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口不要求管理员权限。

开启授权（`authorization.enabled`）后返回结果会按角色过滤。

角色被拒绝时返回空列表。

授权提供方出错时按`fail_closed`配置返回空列表或全部模型。

未认证调用者不经过过滤。

## 请求入参

本接口没有请求参数。

本接口没有请求体。

请求示例。

```
GET /api/models HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`ModelsListResponse`模型推导。

- `models`：模型数组。每个元素是一个模型的信息。
- `token_usage`：token用量显示配置。是一个对象。

`token_usage`对象包含以下字段。字段来自源码`TokenUsageResponse`模型推导。

- `enabled`：是否启用token用量显示。布尔值。默认`false`。

`models`数组中每个元素的字段来自源码`ModelResponse`模型推导。

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
  "models": [
    {
      "name": "gpt-4",
      "model": "gpt-4",
      "display_name": "GPT-4",
      "description": "OpenAI GPT-4 model",
      "supports_thinking": false,
      "supports_reasoning_effort": false,
      "reasoning": {"thinking": "unsupported", "effort": null, "history": null, "source": "legacy"}
    },
    {
      "name": "claude-3-opus",
      "model": "claude-3-opus",
      "display_name": "Claude 3 Opus",
      "description": "Anthropic Claude 3 Opus model",
      "supports_thinking": true,
      "supports_reasoning_effort": false,
      "reasoning": {"thinking": "optional", "effort": null, "history": null, "source": "legacy"}
    }
  ],
  "token_usage": {"enabled": true}
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/models
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" http://localhost:8001/api/models
```
