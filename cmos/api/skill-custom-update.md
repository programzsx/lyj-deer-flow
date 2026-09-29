# 编辑自定义技能接口

## 接口地址

- 请求方法是PUT。
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
- 技能不存在时返回404。
- 内容校验失败时返回400。
- 静态安全扫描未通过时返回400。响应的detail包含`message`、`skill_name`和`findings`。
- 安全扫描决策为`block`时返回400。

## 请求入参

- 请求体是JSON对象。
- 路径参数`skill_name`是自定义技能名称。服务端会去掉名称中的换行字符。

参数说明：

- `content`：字符串。必填。替换后的`SKILL.md`完整内容。

行为说明：

- 服务端先校验markdown内容。
- 服务端运行静态安全扫描。
- 服务端运行内容安全扫描。
- 写入成功后会追加一条`human_edit`历史记录。
- 写入成功后会刷新当前用户的技能提示词缓存。

请求示例：

```json
{
  "content": "---\nname: my-report\ndescription: 生成周报的自定义技能。\n---\n\n# 使用说明\n\n生成一份月报。"
}
```

## 响应出参

- 响应是编辑后的自定义技能对象。
- 结构与查询自定义技能内容接口一致。
- 响应示例来自源码响应模型推导。

响应示例：

```json
{
  "name": "my-report",
  "description": "生成周报的自定义技能。",
  "license": null,
  "category": "custom",
  "enabled": true,
  "editable": true,
  "content": "---\nname: my-report\ndescription: 生成周报的自定义技能。\n---\n\n# 使用说明\n\n生成一份月报。"
}
```

## curl命令

```bash
curl -X PUT "http://localhost:8001/api/skills/custom/my-report" \
  -b "access_token=<token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "---\nname: my-report\ndescription: 生成周报的自定义技能。\n---\n\n# 使用说明\n\n生成一份月报。"
  }'
```
