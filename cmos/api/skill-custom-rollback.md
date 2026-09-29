# 回滚自定义技能接口

## 接口地址

- 请求方法是POST。
- 完整路径是`/api/skills/custom/{skill_name}/rollback`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/skills/custom/my-report/rollback`。
- 路径参数`skill_name`是自定义技能的名称。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限校验是`require_admin_user`。
- 本接口是admin专属接口。调用者必须是管理员。
- 非管理员返回403。错误信息是`Admin privileges required to manage skills.`。
- PAT Bearer调用会返回403。PAT凭据不携带管理员能力。
- 技能不存在且历史文件也不存在时返回404。
- 技能没有历史记录时返回400。
- 历史索引越界时返回400。
- 目标历史条目没有可回滚内容时返回400。
- 回滚被安全扫描拦截时返回400。

## 请求入参

- 请求体是JSON对象。
- 路径参数`skill_name`是自定义技能名称。

参数说明：

- `history_index`：整数。可选。默认值是-1。要恢复的历史条目索引。-1表示最近一次变更。

行为说明：

- 回滚会把目标历史条目的`prev_content`写回技能文件。
- 写回前会重新运行内容校验和静态安全扫描。
- 内容安全扫描会再跑一次。
- 扫描决策为`block`时回滚失败。但拦截记录仍会写入历史。
- 回滚成功后会追加一条`rollback`历史记录。
- 回滚成功后会刷新当前用户的技能提示词缓存。

请求示例：

```json
{
  "history_index": -1
}
```

## 响应出参

- 响应是回滚后的自定义技能对象。
- 结构与查询自定义技能内容接口一致。
- `content`字段是回滚后的文件内容。
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
  "content": "---\nname: my-report\ndescription: 生成周报的自定义技能。\n---\n\n# 使用说明\n\n生成一份周报。"
}
```

## curl命令

```bash
curl -X POST "http://localhost:8001/api/skills/custom/my-report/rollback" \
  -b "access_token=<token>" \
  -H "Content-Type: application/json" \
  -d '{"history_index": -1}'
```
