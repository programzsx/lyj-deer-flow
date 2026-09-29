# 上传并安装技能接口

## 接口地址

- 请求方法是POST。
- 完整路径是`/api/skills/install/upload`。
- 网关端口是8001。
- 完整URL是`http://localhost:8001/api/skills/install/upload`。
- 本接口没有路径参数。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限校验是`require_admin_user`。
- 本接口是admin专属接口。调用者必须是管理员。
- 非管理员返回403。错误信息是`Admin privileges required to manage skills.`。
- PAT Bearer调用会返回403。PAT凭据不携带管理员能力。

## 请求入参

- 请求体是multipart表单。媒体类型必须是`multipart/form-data`。不是multipart时返回422。

参数说明：

- `archive`：文件字段。必填。本地的`.skill`归档文件。文件名必须以`.skill`结尾。否则返回400。

校验规则：

- 文件大小上限是100MiB。超过时返回413。错误信息是`Skill archive exceeds the 100 MiB upload limit`。
- 请求体总大小上限是100MiB加1MiB的multipart框架开销。超过时返回413。
- 同名技能已存在时返回409。
- 安全扫描未通过时返回400。
- 安装成功后会刷新当前用户的技能提示词缓存。

请求示例使用`-F`表单字段。不需要`Content-Type`头。curl会自动生成。

## 响应出参

- 响应是JSON对象。
- 结构与安装技能接口的响应一致。
- 响应示例来自源码响应模型推导。

字段说明：

- `success`：布尔值。安装是否成功。
- `skill_name`：字符串。安装后的技能名称。
- `message`：字符串。安装结果信息。

响应示例：

```json
{
  "success": true,
  "skill_name": "my-skill",
  "message": "Skill installed successfully."
}
```

## curl命令

```bash
curl -X POST "http://localhost:8001/api/skills/install/upload" \
  -b "access_token=<token>" \
  -F "archive=@/path/to/my-skill.skill"
```
