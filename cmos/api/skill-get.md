# 查询技能详情接口

## 接口地址

- 请求方法是GET。
- 完整路径是`/api/skills/{skill_name}`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/skills/skill-reviewer`。
- 路径参数`skill_name`是技能的名称。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码没有`@require_permission`装饰器。
- 本接口不强制登录。
- 授权开启时。调用者角色不可见的技能返回404。404与技能不存在无法区分。
- PAT Bearer调用会返回403。PAT允许清单不包含本接口。

## 请求入参

- 本接口没有请求体。
- 路径参数`skill_name`是技能名称。服务端会去掉名称中的换行字符。

## 响应出参

- 响应是JSON对象。
- 响应示例来自源码响应模型推导。

字段说明：

- `name`：字符串。技能名称。
- `description`：字符串。技能描述。
- `license`：字符串或null。许可证信息。
- `category`：字符串。技能来源类别。取值是`public`、`custom`、`integration`或`legacy`。
- `enabled`：布尔值。技能是否启用。
- `editable`：布尔值。技能是否可编辑或删除。只有`custom`类别为true。

响应示例：

```json
{
  "name": "skill-reviewer",
  "description": "Review the quality of a skill package.",
  "license": "MIT",
  "category": "public",
  "enabled": true,
  "editable": false
}
```

## curl命令

```bash
curl -X GET "http://localhost:8001/api/skills/skill-reviewer" \
  -b "access_token=<token>"
```
