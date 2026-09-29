# 安装技能接口

## 接口地址

- 请求方法是POST。
- 完整路径是`/api/skills/install`。
- 网关端口是8001。
- 完整URL是`http://localhost:8001/api/skills/install`。
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

- 请求体是JSON对象。

参数说明：

- `thread_id`：字符串。必填。`.skill`文件所在的会话线程ID。
- `path`：字符串。必填。`.skill`文件的虚拟路径。例如`mnt/user-data/outputs/my-skill.skill`。

校验规则：

- 虚拟路径解析失败时返回400。
- 文件不存在时返回404。
- 同名技能已存在时返回409。
- 安全扫描未通过时返回400。响应的detail包含`message`、`skill_name`和`findings`。
- 安装成功后会刷新当前用户的技能提示词缓存。

请求示例：

```json
{
  "thread_id": "thread-xyz",
  "path": "mnt/user-data/outputs/my-skill.skill"
}
```

## 响应出参

- 响应是JSON对象。
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
curl -X POST "http://localhost:8001/api/skills/install" \
  -b "access_token=<token>" \
  -H "Content-Type: application/json" \
  -d '{
    "thread_id": "thread-xyz",
    "path": "mnt/user-data/outputs/my-skill.skill"
  }'
```
