# 自定义技能列表接口

## 接口地址

- 请求方法是GET。
- 完整路径是`/api/skills/custom`。
- 网关端口是8001。
- 完整URL是`http://localhost:8001/api/skills/custom`。
- 本接口没有路径参数。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码没有`@require_permission`装饰器。
- 本接口不强制登录。匿名调用不会被可见性过滤。
- 授权开启时。本接口只返回调用者角色可见的自定义技能。
- 授权提供方出错时。fail-closed返回空列表。fail-open返回全部技能。
- PAT Bearer调用会返回403。PAT允许清单不包含本接口。

## 请求入参

- 本接口没有请求体。
- 本接口没有查询参数。

## 响应出参

- 响应是JSON对象。
- 列表只包含当前用户的自定义技能。类别是`custom`。
- legacy共享技能不包含在本接口。legacy技能出现在完整技能列表接口。
- 响应示例来自源码响应模型推导。

字段说明：

- `skills`：数组。自定义技能列表。

`skills`数组元素字段说明：

- `name`：字符串。技能名称。
- `description`：字符串。技能描述。
- `license`：字符串或null。许可证信息。
- `category`：字符串。固定为`custom`。
- `enabled`：布尔值。技能是否启用。
- `editable`：布尔值。固定为true。自定义技能都可编辑。

响应示例：

```json
{
  "skills": [
    {
      "name": "my-report",
      "description": "生成周报的自定义技能。",
      "license": null,
      "category": "custom",
      "enabled": true,
      "editable": true
    }
  ]
}
```

## curl命令

```bash
curl -X GET "http://localhost:8001/api/skills/custom" \
  -b "access_token=<token>"
```
