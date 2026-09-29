# 查询自定义技能历史接口

## 接口地址

- 请求方法是GET。
- 完整路径是`/api/skills/custom/{skill_name}/history`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/skills/custom/my-report/history`。
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
- 技能不存在且历史文件也不存在时返回404。

## 响应出参

- 响应是JSON对象。
- 响应示例来自源码响应模型推导。

字段说明：

- `history`：数组。历史记录列表。

历史记录对象的常见字段：

- `action`：字符串。操作类型。例如`human_edit`、`human_delete`、`rollback`。
- `author`：字符串。操作者。例如`human`。
- `thread_id`：字符串或null。关联的线程ID。
- `file_path`：字符串。被操作的文件路径。通常是`SKILL.md`。
- `prev_content`：字符串或null。操作前的内容。
- `new_content`：字符串或null。操作后的内容。
- `scanner`：对象。安全扫描结果。包含`decision`和`reason`。
- `ts`：字符串。记录时间戳。

响应示例：

```json
{
  "history": [
    {
      "action": "human_edit",
      "author": "human",
      "thread_id": null,
      "file_path": "SKILL.md",
      "prev_content": "旧内容",
      "new_content": "新内容",
      "scanner": {"decision": "allow", "reason": "ok"},
      "ts": "2026-09-29T08:00:00+00:00"
    }
  ]
}
```

## curl命令

```bash
curl -X GET "http://localhost:8001/api/skills/custom/my-report/history" \
  -b "access_token=<token>"
```
