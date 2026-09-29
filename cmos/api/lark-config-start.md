# Lark应用配置启动接口

## 接口地址

请求方法是`POST`。

完整路径是`/api/integrations/lark/config/start`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/integrations/lark/config/start`。

本接口没有路径参数。

## 接口鉴权

认证方式有两种。

第一种是session cookie认证。

浏览器先登录。登录接口是`POST /api/v1/auth/login/local`。

登录成功后，网关下发HttpOnly的`access_token`cookie。

后续请求携带该cookie。

第二种是PAT认证。

PAT是个人访问令牌。令牌以`dfp_`开头。

请求时放在`Authorization`头部。格式是`Bearer <token>`。

token来源说明如下。

session cookie的token来自登录接口。

PAT的token来自用户在令牌管理接口创建的令牌。

权限说明如下。

源码没有使用`@require_permission`装饰器。

该路由只要求认证。不要求特定权限。

但是PAT有路由白名单限制。该路由不在PAT白名单内。

所以PAT调用者访问该路由会返回403。

该路由只支持session cookie认证。

本接口不需要admin权限。

## 请求入参

请求体是JSON对象。

请求字段说明如下。

- `brand`：Lark品牌。字符串类型。可选。默认值是`feishu`。取值是`feishu`或`lark`。表示要为哪个品牌注册应用。

请求示例来自源码请求模型推导。

```json
{
  "brand": "feishu"
}
```

## 响应出参

成功返回HTTP 200。

响应字段说明如下。

- `verification_url`：用户应在浏览器中打开的配置URL。字符串类型。
- `device_code`：设备码。字符串类型。浏览器批准后，用该码调用`config/complete`接口。
- `generation`：服务端生成的代次。字符串类型。该代次绑定本次配置流程。后续调用`config/complete`时必须回传。
- `expires_in`：配置URL过期前的秒数。整数类型或`null`。
- `interval`：Lark建议的轮询间隔秒数。整数类型或`null`。
- `user_code`：Lark显示的用户码。字符串类型或`null`。
- `brand`：本次应用注册流程使用的品牌。字符串类型。

配置流程是首次连接Lark的内部流程。

响应示例来自源码响应模型推导。

```json
{
  "verification_url": "https://open.feishu.cn/auth_v3/index.html?device_id=xxx",
  "device_code": "dev_abc123",
  "generation": "gen_1",
  "expires_in": 300,
  "interval": 5,
  "user_code": "123456",
  "brand": "feishu"
}
```

## curl命令

```bash
curl -s -X POST http://localhost:8001/api/integrations/lark/config/start \
  -H "Cookie: access_token=<token>" \
  -H "Content-Type: application/json" \
  -d '{"brand": "feishu"}'
```
