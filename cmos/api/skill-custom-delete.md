# 删除自定义技能接口

## 接口地址

- 请求方法是DELETE。
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
- 删除校验失败时返回400。

## 请求入参

- 本接口没有请求体。
- 路径参数`skill_name`是自定义技能名称。服务端会去掉名称中的换行字符。

行为说明：

- 删除会移除该自定义技能。
- 删除会追加一条`human_delete`历史记录。
- 删除成功后会刷新当前用户的技能提示词缓存。

## 响应出参

- 响应是JSON对象。
- 响应示例来自源码响应模型推导。

字段说明：

- `success`：布尔值。固定为`true`。表示删除成功。

响应示例：

```json
{
  "success": true
}
```

## curl命令

```bash
curl -X DELETE "http://localhost:8001/api/skills/custom/my-report" \
  -b "access_token=<token>"
```
