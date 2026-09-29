# Lark应用配置完成接口

## 接口地址

请求方法是`POST`。

完整路径是`/api/integrations/lark/config/complete`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/integrations/lark/config/complete`。

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

admin专属行为说明如下。

admin用户可以在响应中看到主机路径字段。

非admin用户的`status.cli.path`字段会被置为`null`。

非admin用户的`status.install_path`字段会被置为空字符串。

## 请求入参

请求体是JSON对象。

请求字段说明如下。

- `device_code`：设备码。字符串类型。必填。该码由`config/start`接口返回。
- `generation`：代次。字符串类型。必填。长度最短1。长度最长64。该值由`config/start`接口返回。代次过期时返回409。
- `brand`：品牌。字符串类型。可选。默认值是`feishu`。该值由`config/start`接口返回。
- `interval`：轮询间隔秒数。整数类型。可选。默认值是`null`。该值由`config/start`接口返回。
- `expires_in`：过期秒数。整数类型。可选。默认值是`null`。该值由`config/start`接口返回。

请求示例来自源码请求模型推导。

```json
{
  "device_code": "dev_abc123",
  "generation": "gen_1",
  "brand": "feishu"
}
```

## 响应出参

成功返回HTTP 200。

响应字段说明如下。

- `success`：配置是否完成。布尔类型。
- `message`：结果说明。字符串类型。
- `generation`：服务端代次。字符串类型。
- `status`：配置后的Lark集成状态。对象类型。字段与Lark状态查询接口的响应字段相同。

`status`对象的主要字段说明如下。

- `installed`：Lark技能包是否已安装。布尔类型。
- `version`：已安装的Lark CLI技能包版本。字符串类型。
- `app_configured`：当前用户是否已配置`app_id`和`app_secret`。布尔类型。
- `app_id`：已配置的Lark应用ID。字符串类型或`null`。
- `app_brand`：已配置的Lark品牌。字符串类型或`null`。
- `install_path`：托管Lark技能包的主机路径。字符串类型。仅admin可见。
- `cli`：lark-cli探测结果。对象类型。字段是`available`、`path`、`version`、`error`。
- `auth`：授权状态探测结果。对象类型。字段是`status`、`message`、`user`、`verified`。
- `sandbox_runtime_mode`：沙箱中lark-cli的供给方式。字符串类型。
- `sandbox_runtime_ready`：沙箱lark-cli运行时是否已就绪。布尔类型。

流程已被更新的流程取代时返回409。

响应示例来自源码响应模型推导。

```json
{
  "success": true,
  "message": "Lark app configured",
  "generation": "gen_1",
  "status": {
    "installed": true,
    "version": "1.0.0",
    "manifest_version": "1.0.0",
    "latest_available_version": "1.0.0",
    "runtime_version_mismatch": false,
    "app_configured": true,
    "app_id": "cli_a1b2c3",
    "app_brand": "feishu",
    "skills_expected": 5,
    "skills_installed": 5,
    "installed_skills": ["lark-doc", "lark-calendar"],
    "enabled_skills": ["lark-doc", "lark-calendar"],
    "install_path": "/home/user/.deer-flow/integrations/skills/feishu",
    "cli": {
      "available": true,
      "path": "/usr/local/bin/lark-cli",
      "version": "1.0.0",
      "error": null
    },
    "auth": {
      "status": "not_configured",
      "message": null,
      "user": null,
      "verified": false
    },
    "sandbox_runtime_mode": "gateway-download",
    "sandbox_runtime_ready": false,
    "sandbox_runtime_detail": null
  }
}
```

## curl命令

```bash
curl -s -X POST http://localhost:8001/api/integrations/lark/config/complete \
  -H "Cookie: access_token=<token>" \
  -H "Content-Type: application/json" \
  -d '{"device_code": "dev_abc123", "generation": "gen_1", "brand": "feishu"}'
```
