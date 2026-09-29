# 发起渠道连接接口

## 接口地址

- 请求方法是POST。
- 完整路径是`/api/channels/{provider}/connect`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/channels/telegram/connect`。
- 路径参数`provider`是渠道提供方标识。取值例如`telegram`、`slack`、`discord`、`feishu`、`dingtalk`、`wechat`、`wecom`、`buzz`。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码没有`@require_permission`装饰器。
- 本接口要求登录。未登录时返回401。
- 未知提供方返回404。
- 渠道连接功能关闭时返回400。
- 渠道未启用或未配置时返回400。
- PAT Bearer调用会返回403。PAT允许清单不包含本接口。

## 请求入参

- 本接口没有请求体。
- 路径参数`provider`是提供方标识。

行为说明：

- 本接口生成一个绑定码。
- 每个用户每个提供方最多5个待使用的绑定码。超过时返回429。
- 绑定码有效期600秒。
- `telegram`提供方返回深链URL。其他渠道返回null的`url`。

## 响应出参

- 响应是JSON对象。
- 响应示例来自源码响应模型推导。

字段说明：

- `provider`：字符串。提供方标识。
- `mode`：字符串。认证模式。取值是`deep_link`或`binding_code`。
- `url`：字符串或null。深链URL。`telegram`返回`https://t.me/{bot_username}?start={code}`。其他渠道为null。
- `code`：字符串。绑定码。
- `instruction`：字符串。操作指引。指引内容是向机器人发送带绑定码的命令。
- `expires_in`：整数。绑定码有效期。单位是秒。固定为600。

响应示例：

```json
{
  "provider": "slack",
  "mode": "binding_code",
  "url": null,
  "code": "a1B2c3D4e5F6g7H8i9J0k1",
  "instruction": "Send /connect a1B2c3D4e5F6g7H8i9J0k1 to the DeerFlow Slack bot.",
  "expires_in": 600
}
```

## curl命令

```bash
curl -X POST "http://localhost:8001/api/channels/telegram/connect" \
  -b "access_token=<token>"
```
