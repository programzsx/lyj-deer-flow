# Lark浏览器授权启动接口

## 接口地址

请求方法是`POST`。

完整路径是`/api/integrations/lark/auth/start`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/integrations/lark/auth/start`。

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

- `recommend`：是否请求官方推荐的自动批准授权范围。布尔类型。可选。默认值是`false`。
- `domains`：可选的Lark授权域列表。字符串数组类型。可选。默认值是空数组。例如`calendar`或`docs`。
- `scope`：可选的显式OAuth授权范围字符串。字符串类型或`null`。可选。默认值是`null`。
- `generation`：当前集成流程的代次。字符串类型或`null`。可选。默认值是`null`。长度最短1。长度最长64。

请求示例来自源码请求模型推导。

```json
{
  "recommend": true,
  "domains": ["calendar", "docs"]
}
```

## 响应出参

成功返回HTTP 200。

本接口是浏览器设备流授权的启动接口。该流程面向没有终端访问权的用户。

响应字段说明如下。

- `verification_url`：用户应在浏览器中打开的授权URL。字符串类型。
- `device_code`：设备码。字符串类型。浏览器批准后，用该码调用`auth/complete`接口。
- `generation`：服务端生成的代次。字符串类型。该代次绑定本次授权流程。后续调用`auth/complete`时必须回传。
- `expires_in`：授权URL过期前的秒数。整数类型或`null`。
- `user_code`：Lark显示的用户码。字符串类型或`null`。
- `hint`：lark-cli返回的可选指引信息。字符串类型或`null`。

响应示例来自源码响应模型推导。

```json
{
  "verification_url": "https://open.feishu.cn/auth_v3/index.html?device_id=xxx",
  "device_code": "dev_xyz789",
  "generation": "gen_3",
  "expires_in": 300,
  "user_code": "654321",
  "hint": null
}
```

## curl命令

```bash
curl -s -X POST http://localhost:8001/api/integrations/lark/auth/start \
  -H "Cookie: access_token=<token>" \
  -H "Content-Type: application/json" \
  -d '{"recommend": true, "domains": ["calendar", "docs"]}'
```
