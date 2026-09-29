# 列出线程已上传文件

## 接口地址

请求方法是`GET`。

完整路径是`/api/threads/{thread_id}/uploads/list`。

网关端口是8001。

完整地址是`http://localhost:8001/api/threads/{thread_id}/uploads/list`。

路径参数`thread_id`是会话线程ID。

## 接口鉴权

本接口要求认证。

认证方式是HttpOnly的`access_token`会话Cookie。

Cookie通过`POST /api/v1/auth/login/local`登录获得。

个人访问令牌（`Authorization: Bearer dfp_...`）会被拒绝。

原因是PAT只允许访问threads/runs/projects白名单路由。

本接口需要`threads:read`权限。

本接口需要线程属主校验。

## 请求入参

本接口有1个路径参数。

- `thread_id`：会话线程ID。必填。字符串。

本接口没有查询参数。

本接口没有请求体。

非法的线程目录返回400。

请求示例。

```
GET /api/threads/thread_xyz/uploads/list HTTP/1.1
Host: localhost:8001
```

## 响应出参

响应是一个JSON对象。

响应字段来自源码`UploadListResponse`模型推导。

- `files`：已上传文件信息数组。每个元素是`UploadedFileInfo`。
- `count`：文件总数。整数。

`files`数组中每个元素的字段来自源码`UploadedFileInfo`模型推导。

- `filename`：服务器上的文件名。
- `size`：文件大小字节数。
- `path`：宿主机文件路径。指向线程沙箱上传目录。
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
  "files": [
    {
      "filename": "report.pdf",
      "size": 102400,
      "path": "/data/sandbox_uploads/thread_xyz/report.pdf",
      "virtual_path": "/mnt/user-data/uploads/report.pdf",
      "artifact_url": "/api/threads/thread_xyz/artifacts/uploads/report.pdf",
      "extension": "pdf",
      "modified": 1705314600.0,
      "original_filename": "report.pdf",
      "markdown_file": "report.md",
      "markdown_path": "/data/sandbox_uploads/thread_xyz/report.md",
      "markdown_virtual_path": "/mnt/user-data/uploads/report.md",
      "markdown_artifact_url": "/api/threads/thread_xyz/artifacts/uploads/report.md"
    }
  ],
  "count": 1
}
```

## curl命令

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8001/api/threads/thread_xyz/uploads/list
```

也可以使用会话Cookie。

```bash
curl -b "access_token=<token>" http://localhost:8001/api/threads/thread_xyz/uploads/list
```
