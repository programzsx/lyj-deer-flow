# 接收GitHub Webhook

## 接口地址

请求方法是`POST`。

完整路径是`/api/webhooks/github`。

网关端口是8001。

完整地址是`http://localhost:8001/api/webhooks/github`。

本接口没有路径参数。

## 接口鉴权

本接口不使用token认证。

本接口不使用会话Cookie。

本接口用HMAC签名验证请求真实性。

签名验证方式是HMAC-SHA256。

签名放在`X-Hub-Signature-256`请求头中。

格式是`sha256=<十六进制摘要>`。

摘要的密钥是`GITHUB_WEBHOOK_SECRET`环境变量。

比较使用常数时间比较。

签名缺失、格式错误或不匹配时返回401。

错误信息是`Invalid or missing X-Hub-Signature-256`。

本接口豁免auth中间件和CSRF中间件。

原因是GitHub不发送会话Cookie也不发送`X-CSRF-Token`。

本接口默认fail-closed。

`GITHUB_WEBHOOK_SECRET`未设置时本路由不挂载。

路由未挂载时请求返回404。

本地开发可以设置`DEER_FLOW_ALLOW_UNVERIFIED_GITHUB_WEBHOOKS=1`。

该模式下所有投递被未验证地接受并记录WARNING。

## 请求入参

本接口有3个必需或可选的请求头。

- `X-Hub-Signature-256`：HMAC-SHA256签名。格式`sha256=<hex>`。生产环境必填。缺失或不匹配返回401。
- `X-GitHub-Event`：GitHub事件类型。必填。缺失返回400。错误信息是`Missing X-GitHub-Event header`。
- `X-GitHub-Delivery`：投递ID。可选。用于日志和响应回显。

本接口的请求体是GitHub发送的JSON payload。

本接口先验证签名再解析JSON。

非法JSON返回400。

错误信息是`Invalid JSON body`。

已知事件类型有6种。

- `ping`
- `issues`
- `issue_comment`
- `pull_request`
- `pull_request_review`
- `pull_request_review_comment`

未知事件返回200。

未知事件的响应中`handled`为`false`。

## 响应出参

响应是一个JSON对象。

响应字段来自源码返回值推导。

- `ok`：是否成功处理。布尔值。成功或无害跳过时为`true`。
- `event`：回显的GitHub事件类型。
- `delivery`：回显的投递ID。
- `handled`：事件是否被识别并分发给代理。布尔值。
- `dispatch`：分发摘要。可为`null`。包含匹配、触发和跳过的代理信息。

`channels.github`未启用时响应返回200。

响应中`dispatch`包含`skipped: channel_disabled`。

通道服务不可用时响应返回200。

响应中`dispatch`包含`error: channel_service_not_available`和配置提示。

瞬时分发失败返回503。

503让GitHub把投递记录为失败。

GitHub不会自动重试任何失败投递。

原因是GitHub的投递重试没有5xx自动重试。

操作员可以通过GitHub的Redeliver按钮或REST接口手动重投。

响应示例来自源码响应模型推导。

```json
{
  "ok": true,
  "event": "issues",
  "delivery": "72d3162e-cc78-11e3-81ab-4c9367dc0958",
  "handled": true,
  "dispatch": {
    "matched": 1,
    "fired": 1,
    "skipped": 0
  }
}
```

未知事件或未启用时的响应示例。

```json
{
  "ok": true,
  "event": "fork",
  "delivery": "72d3162e-cc78-11e3-81ab-4c9367dc0958",
  "handled": false,
  "dispatch": null
}
```

## curl命令

本接口通常由GitHub调用。

本地测试可以手工构造签名请求。

```bash
BODY='{"action":"opened","repository":{"full_name":"org/repo"}}'
SIGNATURE=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "GITHUB_WEBHOOK_SECRET" -hex | sed 's/^.* //')
curl -X POST -H "Content-Type: application/json" -H "X-GitHub-Event: issues" -H "X-Hub-Signature-256: sha256=<hmac_signature>" -d "$BODY" http://localhost:8001/api/webhooks/github
```

`<hmac_signature>`用`sha256=`开头的HMAC-SHA256十六进制摘要替换。

摘要的密钥是`GITHUB_WEBHOOK_SECRET`环境变量的值。
