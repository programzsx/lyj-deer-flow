# 断开渠道连接接口

## 接口地址

- 请求方法是DELETE。
- 完整路径是`/api/channels/connections/{connection_id}`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/channels/connections/conn-001`。
- 路径参数`connection_id`是渠道连接的ID。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码没有`@require_permission`装饰器。
- 本接口要求登录。未登录时返回401。
- 只有连接的所有者可以断开连接。
- PAT Bearer调用会返回403。PAT允许清单不包含本接口。

## 请求入参

- 本接口没有请求体。
- 路径参数`connection_id`是连接ID。

行为说明：

- 渠道连接功能关闭时返回400。
- 连接不存在或不属于当前用户时返回404。
- 断开成功后连接状态改为`revoked`。
- 断开会同时删除连接的凭据记录。

## 响应出参

- 成功时响应状态码是204。
- 成功时响应体为空。

## curl命令

```bash
curl -X DELETE "http://localhost:8001/api/channels/connections/conn-001" \
  -b "access_token=<token>"
```
