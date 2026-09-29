# Lark技能包安装接口

## 接口地址

请求方法是`POST`。

完整路径是`/api/integrations/lark/install`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/integrations/lark/install`。

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

源码使用`require_admin_user`检查。

本接口是admin专属接口。

非admin调用者返回403。错误信息是`Admin privileges required to install integrations.`。

PAT调用者访问该路由会返回403。因为该路由不在PAT路由白名单内。

本接口只能由admin的session cookie调用。

## 请求入参

本接口没有路径参数。

本接口没有请求体。

本接口没有查询参数。

请求示例见curl命令一节。

## 响应出参

成功返回HTTP 200。

响应字段说明如下。

- `success`：安装是否成功。布尔类型。
- `installed_skills`：已安装的技能名称列表。字符串数组类型。
- `message`：安装结果说明。字符串类型。
- `status`：安装后的Lark集成状态。对象类型。字段与Lark状态查询接口的响应字段相同。

`status`对象的字段说明如下。

- `installed`：Lark技能包是否已安装。布尔类型。
- `version`：已安装的Lark CLI技能包版本。字符串类型。
- `manifest_version`：已安装的manifest版本。字符串类型或`null`。
- `latest_available_version`：GitHub上最新的发布版本。字符串类型或`null`。
- `runtime_version_mismatch`：技能包版本与运行时lark-cli是否不一致。布尔类型。
- `app_configured`：当前用户是否已配置`app_id`和`app_secret`。布尔类型。
- `app_id`：已配置的Lark应用ID。字符串类型或`null`。
- `app_brand`：已配置的Lark品牌。字符串类型或`null`。
- `skills_expected`：官方技能包应包含的技能数量。整数类型。
- `skills_installed`：已安装的托管Lark技能数量。整数类型。
- `installed_skills`：已安装的托管Lark技能名称列表。字符串数组类型。
- `enabled_skills`：当前用户已启用的Lark技能名称列表。字符串数组类型。
- `install_path`：托管Lark技能包的主机路径。字符串类型。admin可见。
- `cli`：lark-cli探测结果。对象类型。字段是`available`、`path`、`version`、`error`。
- `auth`：授权状态探测结果。对象类型。字段是`status`、`message`、`user`、`verified`。
- `sandbox_runtime_mode`：沙箱中lark-cli的供给方式。字符串类型。
- `sandbox_runtime_ready`：沙箱lark-cli运行时是否已就绪。布尔类型。
- `sandbox_runtime_detail`：沙箱运行时未就绪时的原因说明。字符串类型或`null`。

安装成功后，网关会刷新技能系统提示词缓存。

响应示例来自源码响应模型推导。

```json
{
  "success": true,
  "installed_skills": ["lark-doc", "lark-calendar"],
  "message": "Installed Lark integration",
  "status": {
    "installed": true,
    "version": "1.0.0",
    "manifest_version": "1.0.0",
    "latest_available_version": "1.0.0",
    "runtime_version_mismatch": false,
    "app_configured": false,
    "app_id": null,
    "app_brand": null,
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
curl -s -X POST http://localhost:8001/api/integrations/lark/install \
  -H "Cookie: access_token=<token>"
```
