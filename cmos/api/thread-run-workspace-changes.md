# 获取运行的工作区变更

## 接口地址

接口地址是`GET /api/threads/{thread_id}/runs/{run_id}/workspace-changes`。
网关端口是8001。
完整地址是`http://localhost:8001/api/threads/{thread_id}/runs/{run_id}/workspace-changes`。
路径参数`thread_id`是线程ID。线程ID匹配`^[A-Za-z0-9_-]{1,64}$`。
路径参数`run_id`是运行ID。

## 接口鉴权
这个接口需要登录。
认证方式支持两种。
第一种是session cookie的`access_token`。
第二种是PAT的`Authorization: Bearer dfp_...`。
需要的权限是`runs:read`。
这个接口要求调用者是线程的所有者。
token来源是`POST /api/v1/auth/login/local`。
GET请求不需要CSRF头。
运行不存在或不属于这个线程时返回404。

## 请求入参
这个接口没有请求体。参数通过查询字符串传递。
- `include_files`：布尔值。是否包含文件列表。默认true。
- `include_diff`：布尔值。是否包含文本diff。默认true。

## 响应出参
响应体是一个对象。返回这个运行记录的工作区和输出文件变更。
响应示例来自源码响应模型推导。
- `available`：布尔值。是否存在变更事件。
- `version`：整数。载荷格式版本。值为1。
- `summary`：对象。变更计数摘要。包含`created`、`modified`、`deleted`、`symlink_created`、`additions`、`deletions`、`truncated`。
- `files`：数组。变更文件列表。`include_files=false`时是空数组。`include_diff=false`时每个文件的`diff`是空字符串。每个文件包含路径和`diff`等字段。
- `limits`：对象。载荷限制信息。

响应示例。
```json
{
  "available": true,
  "version": 1,
  "summary": {
    "created": 1,
    "modified": 0,
    "deleted": 0,
    "symlink_created": 0,
    "additions": 12,
    "deletions": 0,
    "truncated": false
  },
  "files": [
    {
      "path": "report.md",
      "change_type": "created",
      "diff": "--- \n+++ \n@@ -0,0 +1 @@\n+报告内容"
    }
  ],
  "limits": {}
}
```

## curl命令
```bash
curl -X GET "http://localhost:8001/api/threads/f47ac10b-58cc-4372-a567-0e02b2c3d479/runs/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/workspace-changes?include_files=true&include_diff=true" \
  -H "Authorization: Bearer <token>"
```
