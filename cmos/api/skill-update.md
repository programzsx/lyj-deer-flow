# 更新技能启用状态接口

## 接口地址

- 请求方法是PUT。
- 完整路径是`/api/skills/{skill_name}`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/skills/skill-reviewer`。
- 路径参数`skill_name`是技能的名称。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限校验是`require_admin_user`。
- 本接口是admin专属接口。调用者必须是管理员。
- 非管理员返回403。错误信息是`Admin privileges required to manage skills.`。
- 管理员判断基于用户的`system_role`等于`admin`。
- PAT Bearer调用会返回403。PAT凭据不携带管理员能力。
- 技能不存在时返回404。

## 请求入参

- 请求体是JSON对象。
- 路径参数`skill_name`是技能名称。服务端会去掉名称中的换行字符。

参数说明：

- `enabled`：布尔值。必填。是否启用该技能。

行为说明：

- 公共技能的启用状态写入全局`extensions_config.json`。状态是全用户共享的。
- 自定义和legacy技能的启用状态写入当前用户的隔离状态文件。同名自定义技能在不同用户间独立切换。
- 公共技能切换会清空全部用户的提示词缓存。
- 自定义技能切换只清空当前用户的提示词缓存。

请求示例：

```json
{
  "enabled": false
}
```

## 响应出参

- 响应是更新后的技能对象。
- 响应示例来自源码响应模型推导。

字段说明：

- `name`：字符串。技能名称。
- `description`：字符串。技能描述。
- `license`：字符串或null。许可证信息。
- `category`：字符串。技能来源类别。
- `enabled`：布尔值。更新后的启用状态。
- `editable`：布尔值。技能是否可编辑或删除。

响应示例：

```json
{
  "name": "skill-reviewer",
  "description": "Review the quality of a skill package.",
  "license": "MIT",
  "category": "public",
  "enabled": false,
  "editable": false
}
```

## curl命令

```bash
curl -X PUT "http://localhost:8001/api/skills/skill-reviewer" \
  -b "access_token=<token>" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```
