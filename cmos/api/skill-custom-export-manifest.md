# 预览自定义技能导出接口

## 接口地址

- 请求方法是GET。
- 完整路径是`/api/skills/custom/{skill_name}/export-manifest`。
- 网关端口是8001。
- 完整URL示例是`http://localhost:8001/api/skills/custom/my-report/export-manifest`。
- 路径参数`skill_name`是自定义技能的名称。

## 接口鉴权

- 本接口使用session cookie认证。
- cookie名称是`access_token`。
- cookie由`POST /api/v1/auth/login/local`登录接口创建。
- 源码权限校验是`require_admin_user`。
- 本接口是admin专属接口。调用者必须是管理员。
- 非管理员返回403。错误信息是`Admin privileges required to manage skills.`。
- PAT Bearer调用会返回403。PAT凭据不携带管理员能力。
- 技能不存在时返回404。detail包含错误码和错误信息。
- 导出槽位占用时返回429。本网关进程同时只有2个导出槽位。

## 请求入参

- 本接口没有请求体。
- 本接口没有查询参数。
- 路径参数`skill_name`是自定义技能名称。

行为说明：

- 本接口预览导出清单。不返回归档文件。
- 客户端提前断开时返回204。
- 响应带有`Cache-Control: private, no-store`头。

## 响应出参

- 响应是JSON对象。
- 响应示例来自源码响应模型推导。

字段说明：

- `skill_name`：字符串。技能名称。
- `revision`：字符串或null。当前内容修订标识。
- `can_export`：布尔值。是否允许导出。
- `file_count`：整数。文件数量。
- `directory_count`：整数。目录数量。
- `total_bytes`：整数。总字节数。
- `files`：数组。文件清单。
- `requirements`：对象。技能的声明要求。
- `warnings`：数组。导出警告列表。
- `blockers`：数组。导出阻塞列表。

`files`数组元素字段说明：

- `path`：字符串。文件路径。
- `type`：字符串。取值是`file`或`directory`。
- `size`：整数。文件大小。单位是字节。
- `executable`：布尔值。是否可执行。

`requirements`对象字段说明：

- `compatibility`：字符串或null。兼容性声明。
- `allowed_tools`：数组或null。允许的工具列表。
- `required_secrets`：数组或null。需要的密钥列表。元素包含`name`和`optional`。

`warnings`和`blockers`数组元素字段说明：

- `code`：字符串。错误码。
- `message`：字符串。错误信息。
- `path`：字符串或null。关联路径。

响应示例：

```json
{
  "skill_name": "my-report",
  "revision": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
  "can_export": true,
  "file_count": 2,
  "directory_count": 1,
  "total_bytes": 4096,
  "files": [
    {"path": "SKILL.md", "type": "file", "size": 1024, "executable": false},
    {"path": "scripts", "type": "directory", "size": 0, "executable": false}
  ],
  "requirements": {
    "compatibility": null,
    "allowed_tools": null,
    "required_secrets": null
  },
  "warnings": [],
  "blockers": []
}
```

## curl命令

```bash
curl -X GET "http://localhost:8001/api/skills/custom/my-report/export-manifest" \
  -b "access_token=<token>"
```
