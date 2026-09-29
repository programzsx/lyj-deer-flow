# 上传文件到线程

## 接口地址

请求方法是`POST`。

完整路径是`/api/threads/{thread_id}/uploads`。

网关端口是8001。

完整地址是`http://localhost:8001/api/threads/{thread_id}/uploads`。

路径参数`thread_id`是会话线程ID。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`threads:write`权限。

本接口需要线程属主校验。

文件存储在线程隔离目录中。

目录在解析用户的空间下。

路径是`users/{user_id}/threads/{thread_id}/user-data/uploads`。

## 请求入参

本接口的请求体是multipart/form-data表单。

本接口有1个路径参数。

- `thread_id`：会话线程ID。必填。字符串。

本接口有1个表单字段。

- `files`：要上传的文件列表。必填。multipart文件数组。可以为多个文件。空列表返回400。

上传限制来自`config.yaml`的uploads配置。

默认限制是单次最多10个文件。

默认单文件上限50MiB。

默认总大小上限100MiB。

文件数超限时返回413。

错误信息是`Too many files: maximum is <上限>`。

PDF、PPT、Excel、Word文档会被自动转换为markdown。

自动转换需要`uploads.auto_convert_documents`配置开启。

安全默认是关闭。

重复文件名会获得`_N`后缀。

不安全文件名的文件会被跳过。

不安全目标位置的文件会被跳过并记录在`skipped_files`。

沙箱为非线程挂载时上传文件会同步进线程沙箱。

调用者被拒绝`sandbox:execute`权限时跳过沙箱同步。

上传本身仍然成功。

请求示例。

```bash
curl -X POST -H "Authorization: Bearer <token>" -F "files=@report.pdf" -F "files=@notes.txt" http://localhost:8001/api/threads/thread_xyz/uploads
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`UploadResponse`模型推导。

- `success`：上传是否完全成功。布尔值。有跳过文件时为`false`。
- `files`：已上传文件信息数组。每个元素是`UploadedFileInfo`。
- `message`：上传结果消息。字符串。
- `skipped_files`：被跳过的不安全文件名数组。默认空数组。

`files`数组中每个元素的字段来自源码`UploadedFileInfo`模型推导。

- `filename`：服务器上的最终文件名。
- `size`：文件大小字节数。
- `path`：宿主机文件路径。
- `virtual_path`：沙箱虚拟路径。
- `artifact_url`：产物访问URL。
- `extension`：文件扩展名。可为`null`。
- `modified`：最后修改时间戳。可为`null`。
- `original_filename`：原始文件名。可为`null`。
- `markdown_file`：转换后的markdown文件名。可为`null`。
- `markdown_path`：markdown文件路径。可为`null`。
- `markdown_virtual_path`：markdown沙箱虚拟路径。可为`null`。
- `markdown_artifact_url`：markdown产物URL。可为`null`。

响应示例来自源码响应模型推导。

```json
{
  "success": true,
  "files": [
    {
      "filename": "report.pdf",
      "size": 102400,
      "path": "/data/users/user-123/threads/thread_xyz/user-data/uploads/report.pdf",
      "virtual_path": "/mnt/user-data/uploads/report.pdf",
      "artifact_url": "/api/threads/thread_xyz/artifacts/uploads/report.pdf",
      "extension": "pdf",
      "modified": 1705314600.0,
      "original_filename": "report.pdf",
      "markdown_file": "report.md",
      "markdown_path": "/data/users/user-123/threads/thread_xyz/user-data/uploads/report.md",
      "markdown_virtual_path": "/mnt/user-data/uploads/report.md",
      "markdown_artifact_url": "/api/threads/thread_xyz/artifacts/uploads/report.md"
    }
  ],
  "message": "Successfully uploaded 1 file(s)",
  "skipped_files": []
}
```

## curl命令

```bash
curl -X POST -H "Authorization: Bearer <token>" -F "files=@report.pdf" http://localhost:8001/api/threads/thread_xyz/uploads
```

也可以使用会话Cookie。

```bash
curl -X POST -b "access_token=<token>" -F "files=@report.pdf" http://localhost:8001/api/threads/thread_xyz/uploads
```
