# 删除线程上传文件

## 接口地址

请求方法是`DELETE`。

完整路径是`/api/threads/{thread_id}/uploads/{filename}`。

网关端口是8001。

完整地址是`http://localhost:8001/api/threads/{thread_id}/uploads/{filename}`。

路径参数`thread_id`是会话线程ID。

路径参数`filename`是要删除的文件名。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`threads:delete`权限。

本接口需要线程属主校验。

本接口要求线程记录存在。

线程记录不存在时按404拒绝。

原因是本接口是破坏性路由。

## 请求入参

本接口有2个路径参数。

- `thread_id`：会话线程ID。必填。字符串。
- `filename`：要删除的文件名。必填。字符串。

本接口没有请求体。

本接口只删除指定的单个文件。

转换文档的markdown伴随文件不会被删除。

原因是markdown文件可能属于共享词干的其他文档。

markdown文件保持列出状态。

markdown文件可以单独删除。

只删除普通文件。

符号链接不会被删除。

符号链接报告为不存在。

原因是沙箱进程可能在上传名下放置符号链接。

文件不存在时返回404。

错误信息是`File not found: <文件名>`。

路径穿越时返回400。

错误信息是`Invalid path`。

删除失败时返回500。

请求示例。

```
DELETE /api/threads/thread_xyz/uploads/report.pdf HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`delete_file_safe`返回值推导。

- `success`：删除是否成功。布尔值。
- `message`：删除结果消息。字符串。

响应示例来自源码响应模型推导。

```json
{
  "success": true,
  "message": "Deleted report.pdf"
}
```

## curl命令

```bash
curl -X DELETE -H "Authorization: Bearer <token>" http://localhost:8001/api/threads/thread_xyz/uploads/report.pdf
```

也可以使用会话Cookie。

```bash
curl -X DELETE -b "access_token=<token>" http://localhost:8001/api/threads/thread_xyz/uploads/report.pdf
```
