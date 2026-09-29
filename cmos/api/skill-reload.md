# 重载技能缓存接口

## 接口地址

- 请求方法是POST。
- 完整路径是`/api/skills/reload`。
- 网关端口是8001。
- 完整URL是`http://localhost:8001/api/skills/reload`。
- 本接口没有路径参数。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限校验是`require_admin_user`。
- 本接口是admin专属接口。调用者必须是管理员。
- 非管理员返回403。错误信息是`Admin privileges required to manage skills.`。
- 缓存失效失败时返回500。
- PAT Bearer调用会返回403。PAT凭据不携带管理员能力。

## 请求入参

- 本接口没有请求体。
- 本接口没有查询参数。

行为说明：

- 本接口失效当前网关进程的技能提示词缓存。
- 缓存覆盖所有用户。
- 后续运行会重新扫描配置的技能目录。
- 运行中的任务不受影响。
- 其他网关进程不受影响。

## 响应出参

- 响应是JSON对象。
- 响应示例来自源码响应模型推导。

字段说明：

- `success`：布尔值。缓存是否成功失效。
- `scope`：字符串。重载范围。固定为`process`。表示只影响当前网关进程。
- `message`：字符串。人类可读的重载状态说明。

响应示例：

```json
{
  "success": true,
  "scope": "process",
  "message": "Skill caches invalidated; subsequent runs in this Gateway process will rescan the latest skills."
}
```

## curl命令

```bash
curl -X POST "http://localhost:8001/api/skills/reload" \
  -b "access_token=<token>"
```
