# Lark应用凭据切换接口

## 接口地址

请求方法是`POST`。

完整路径是`/api/integrations/lark/config/credentials`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/integrations/lark/config/credentials`。

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

- `app_id`：Lark/Feishu应用ID。字符串类型。必填。表示要把当前用户的集成切换到这个应用。
- `app_secret`：Lark/Feishu应用密钥。字符串类型。必填。该密钥与`app_id`配对。
- `brand`：Lark品牌。字符串类型。可选。默认值是`feishu`。取值是`feishu`或`lark`。

请求示例来自源码请求模型推导。

```json
{
  "app_id": "cli_a1b2c3",
  "app_secret": "secret123",
  "brand": "feishu"
}
```

## 响应出参

成功返回HTTP 200。

本接口的行为说明如下。

源码会先通过官方CLI的实时租户token探针验证新的`app_id`和`app_secret`。

验证通过后，源码原子性地切换当前用户的Lark应用。

源码会撤销并移除之前的OAuth token。

切换失败时，源码会恢复之前的凭据树。

响应字段说明如下。

- `success`：切换是否成功。布尔类型。
- `message`：结果说明。字符串类型。
- `generation`：服务端代次。字符串类型。
- `status`：切换后的Lark集成状态。对象类型。字段与Lark状态查询接口的响应字段相同。

`status`对象的主要字段说明如下。

- `installed`：Lark技能包是否已安装。布尔类型。
- `version`：已安装的Lark CLI技能包版本。字符串类型。
- `app_configured`：当前用户是否已配置`app_id`和`app_secret`。布尔类型。
- `app_id`：已配置的Lark应用ID。字符串类型或`null`。返回新切换的应用ID。
- `app_brand`：已配置的Lark品牌。字符串类型或`null`。
- `install_path`：托管Lark技能包的主机路径。字符串类型。仅admin可见。
- `cli`：lark-cli探测结果。对象类型。字段是`available`、`path`、`version`、`error`。
- `auth`：授权状态探测结果。对象类型。字段是`status`、`message`、`user`、`verified`。

响应示例来自源码响应模型推导。

```json
{
  "success": true,
  "message": "Lark app credentials updated",
  "generation": "gen_2",
  "status": {
    "installed": true,
    "version": "1.0.0",
    "manifest_version": "1.0.0",
    "latest_available_version": "1.0.0",
    "runtime_version_mismatch": false,
    "app_configured": true,
    "app_id": "cli_newapp",
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
      "message": "Previous OAuth tokens revoked",
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
curl -s -X POST http://localhost:8001/api/integrations/lark/config/credentials \
  -H "Cookie: access_token=<token>" \
  -H "Content-Type: application/json" \
  -d '{"app_id": "cli_a1b2c3", "app_secret": "secret123", "brand": "feishu"}'
```
