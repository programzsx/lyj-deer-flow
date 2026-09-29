# 退出登录

## 接口地址

接口地址是`POST /api/v1/auth/logout`。
网关端口是8001。
完整地址是`http://localhost:8001/api/v1/auth/logout`。

## 接口鉴权
这个接口不需要登录。
这个接口免鉴权。它免CSRF校验。
token来源是`POST /api/v1/auth/login/local`。

## 请求入参
这个接口没有请求体。也没有路径参数和查询参数。

## 响应出参
响应体来自`MessageResponse`模型。响应示例来自源码响应模型推导。
这个接口清除`access_token`、`csrf_token`和会话偏好cookie。
- `message`：字符串。结果说明。

响应示例。
```json
{
  "message": "Successfully logged out"
}
```

## curl命令
```bash
curl -X POST "http://localhost:8001/api/v1/auth/logout"
```
