# 查询自定义技能内容接口

## 接口地址

- 请求方法是GET。
- 完整路径是`/api/skills/custom/{skill_name}`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/skills/custom/my-report`。
- 路径参数`skill_name`是自定义技能的名称。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限校验是`require_admin_user`。
- 本接口是admin专属接口。调用者必须是管理员。
- 非管理员返回403。错误信息是`Admin privileges required to manage skills.`。
- PAT Bearer调用会返回403。PAT凭据不携带管理员能力。

## 请求入参

- 本接口没有请求体。
- 路径参数`skill_name`是自定义技能名称。服务端会去掉名称中的换行字符。
- 技能不存在或类别不是`custom`时返回404。

## 响应出参

- 响应是JSON对象。
- 响应示例来自源码响应模型推导。

字段说明：

- `name`：字符串。技能名称。
- `description`：字符串。技能描述。
- `license`：字符串或null。许可证信息。
- `category`：字符串。固定为`custom`。
- `enabled`：布尔值。技能是否启用。
- `editable`：布尔值。固定为true。
- `content`：字符串。`SKILL.md`的原始内容。

响应示例：

```json
{
  "name": "my-report",
  "description": "生成周报的自定义技能。",
  "license": null,
  "category": "custom",
  "enabled": true,
  "editable": true,
  "content": "---\nname: my-report\ndescription: 生成周报的自定义技能。\n---\n\n# 使用说明\n\n生成一份周报。"
}
```

## curl命令

```bash
curl -X GET "http://localhost:8001/api/skills/custom/my-report" \
  -b "access_token=<token>"
```
