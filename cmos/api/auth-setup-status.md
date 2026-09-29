# 检查系统初始化状态

## 接口地址

接口地址是`GET /api/v1/auth/setup-status`。
网关端口是8001。
完整地址是`http://localhost:8001/api/v1/auth/setup-status`。

## 接口鉴权
这个接口不需要登录。
这个接口免鉴权。它免CSRF校验。
token来源是`POST /api/v1/auth/login/local`。
结果按IP缓存60秒。已初始化的结果会被缓存。

## 请求入参
这个接口没有请求体。也没有路径参数和查询参数。

## 响应出参
响应体是一个对象。响应示例来自源码响应模型推导。
- `needs_setup`：布尔值。是否需要初始化。管理员账号数为0时是true。
- `registration_enabled`：布尔值。本地注册是否开放。对应`auth.local.allow_registration`配置。配置文件缺失时默认true。

响应示例。
```json
{
  "needs_setup": true,
  "registration_enabled": true
}
```

## curl命令
```bash
curl -X GET "http://localhost:8001/api/v1/auth/setup-status"
```
