# Lark集成状态查询接口

## 接口地址

请求方法是`GET`。

完整路径是`/api/integrations/lark/status`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/integrations/lark/status`。

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

admin用户可以看到响应中的主机路径字段。

非admin用户的`cli.path`字段会被置为`null`。

非admin用户的`install_path`字段会被置为空字符串。

## 请求入参

本接口没有路径参数。

本接口没有请求体。

本接口没有查询参数。

请求示例见curl命令一节。

## 响应出参

成功返回HTTP 200。

响应字段说明如下。

- `installed`：Lark技能包是否已安装。布尔类型。
- `version`：已安装的Lark CLI技能包版本。字符串类型。版本来自安装时的manifest。
- `manifest_version`：已安装的manifest版本。字符串类型或`null`。
- `latest_available_version`：GitHub上最新的larksuite/cli发布版本。字符串类型或`null`。未知时为`null`。
- `runtime_version_mismatch`：技能包版本与运行时lark-cli二进制是否不一致。布尔类型。
- `app_configured`：当前用户的lark-cli是否已配置`app_id`和`app_secret`。布尔类型。
- `app_id`：已配置的Lark应用ID。字符串类型或`null`。
- `app_brand`：已配置的Lark品牌。字符串类型或`null`。取值是`feishu`或`lark`。
- `skills_expected`：官方技能包应包含的技能数量。整数类型。
- `skills_installed`：已安装的托管Lark技能数量。整数类型。
- `installed_skills`：已安装的托管Lark技能名称列表。字符串数组类型。
- `enabled_skills`：当前用户已启用的Lark技能名称列表。字符串数组类型。
- `install_path`：托管Lark技能包的主机路径。字符串类型。仅admin可见。非admin为空字符串。
- `cli`：lark-cli探测结果。对象类型。
- `auth`：授权状态探测结果。对象类型。
- `sandbox_runtime_mode`：沙箱中lark-cli的供给方式。字符串类型。取值是`none`、`gateway-download`、`init-container`或`broker`。默认值是`none`。
- `sandbox_runtime_ready`：沙箱lark-cli运行时是否已就绪。布尔类型。
- `sandbox_runtime_detail`：沙箱运行时未就绪时的原因说明。字符串类型或`null`。

`cli`对象的字段说明如下。

- `available`：lark-cli是否可用。布尔类型。
- `path`：lark-cli可执行文件路径。字符串类型或`null`。仅admin可见。非admin为`null`。
- `version`：lark-cli版本输出。字符串类型或`null`。
- `error`：探测失败信息。字符串类型或`null`。

`auth`对象的字段说明如下。

- `status`：授权状态。字符串类型。取值是`authenticated`、`not_configured`、`unavailable`或`error`。
- `message`：状态详情。字符串类型或`null`。
- `user`：已授权的Lark用户显示值。字符串类型或`null`。
- `verified`：该状态是否来自真实的token验证。布尔类型。默认值是`false`。

响应示例来自源码响应模型推导。

```json
{
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
    "status": "authenticated",
    "message": null,
    "user": "张三",
    "verified": true
  },
  "sandbox_runtime_mode": "gateway-download",
  "sandbox_runtime_ready": true,
  "sandbox_runtime_detail": null
}
```

## curl命令

```bash
curl -s http://localhost:8001/api/integrations/lark/status \
  -H "Cookie: access_token=<token>"
```
