# 重启IM通道

## 接口地址

请求方法是`POST`。

完整路径是`/api/channels/{name}/restart`。

网关端口是8001。

完整地址是`http://localhost:8001/api/channels/{name}/restart`。

路径参数`name`是通道名称。

常见取值是`feishu`、`slack`、`telegram`、`discord`、`dingtalk`、`github`。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT不携带管理员能力。

本接口是管理员专属接口。

非管理员调用返回403。

错误信息是`Admin privileges required to manage channel runtime workers.`。

## 请求入参

本接口有1个路径参数。

- `name`：要重启的通道名称。必填。字符串。

本接口没有请求体。

请求示例。

```
POST /api/channels/feishu/restart HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`ChannelRestartResponse`模型推导。

- `success`：重启是否成功。布尔值。
- `message`：重启结果消息。字符串。

通道服务未运行时返回503。

错误信息是`Channel service is not running`。

重启成功时`success`为`true`。

重启失败时`success`为`false`。

响应示例来自源码响应模型推导。

```json
{
  "success": true,
  "message": "Channel feishu restarted successfully"
}
```

重启失败时的响应示例。

```json
{
  "success": false,
  "message": "Failed to restart channel feishu"
}
```

## curl命令

```bash
curl -X POST -H "Authorization: Bearer <token>" http://localhost:8001/api/channels/feishu/restart
```

也可以使用会话Cookie。

```bash
curl -X POST -b "access_token=<token>" http://localhost:8001/api/channels/feishu/restart
```
