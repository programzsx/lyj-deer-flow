# 获取IM通道状态

## 接口地址

请求方法是`GET`。

完整路径是`/api/channels/`。

网关端口是8001。

完整地址是`http://localhost:8001/api/channels/`。

本接口没有路径参数。

路径末尾的斜杠需要保留。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口不要求管理员权限。

任何已认证用户都可以查询通道状态。

## 请求入参

本接口没有请求参数。

本接口没有请求体。

请求示例。

```
GET /api/channels/ HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`ChannelStatusResponse`模型推导。

- `service_running`：通道服务是否在运行。布尔值。服务未启动时为`false`。
- `channels`：通道状态字典。键是通道名称。值是该通道的状态对象。服务未启动时为空对象`{}`。

`channels`字典中每个值包含以下字段。字段来自源码`get_status`逻辑推导。

- `enabled`：该通道是否在配置中启用。布尔值。取自`channels.<name>.enabled`配置。
- `running`：该通道工作进程是否在运行。布尔值。

响应示例来自源码响应模型推导。

```json
{
  "service_running": true,
  "channels": {
    "feishu": {"enabled": true, "running": true},
    "slack": {"enabled": false, "running": false},
    "telegram": {"enabled": true, "running": true},
    "discord": {"enabled": false, "running": false},
    "dingtalk": {"enabled": false, "running": false},
    "github": {"enabled": true, "running": true}
  }
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/channels/
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" http://localhost:8001/api/channels/
```
