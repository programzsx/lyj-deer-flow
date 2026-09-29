# 项目文档内容获取接口

## 接口地址

请求方法是`GET`。

完整路径是`/api/projects/{project_id}/documents/{document_id}/content`。

网关端口是8001。

完整地址示例是`http://localhost:8001/api/projects/p_123/documents/doc_001/content`。

路径参数说明如下。

- `project_id`：项目ID。字符串类型。表示文档所属的项目。
- `document_id`：文档ID。字符串类型。表示要获取内容的项目文档。

## 接口鉴权

认证方式有两种。

第一种是session cookie认证。

浏览器先登录。登录接口是`POST /api/v1/auth/login/local`。

登录成功后，网关下发HttpOnly的`access_token`cookie。

后续请求携带该cookie。

第二种是PAT认证。

PAT是个人访问令牌。令牌以`dfp_`开头。

请求时放在`Authorization`头部。格式是`Bearer <token>`。

token来源说明如下。

session cookie的token来自登录接口。

PAT的token来自用户在令牌管理接口创建的令牌。

权限说明如下。

源码使用装饰器`@require_permission("projects", "read")`。

调用者需要`projects:read`权限。

session用户的权限来自授权配置。授权关闭时，session用户拥有全部权限。

PAT调用者需要令牌作用域包含`projects:read`。

该路由在PAT路由白名单内。PAT以令牌所属用户的身份执行。

本接口不需要admin权限。

项目不存在或不属于调用者时返回404。源码故意不区分这两种情况。

已归档项目的文档保持可读。归档项目不影响本接口。

## 请求入参

路径参数说明如下。

- `project_id`：项目ID。字符串类型。表示文档所属的项目。
- `document_id`：文档ID。字符串类型。表示要获取内容的项目文档。

查询参数说明如下。

- `download`：是否强制下载。布尔类型。可选。默认值是`false`。

本接口没有请求体。

请求示例见curl命令一节。

## 响应出参

本接口返回文件内容。响应是文件流。

成功返回HTTP 200。

响应行为说明如下。

`download=false`时的行为说明如下。

文本内容内联返回。存在转换后的markdown伴随文件时，返回该伴随文件。不存在时返回采样为文本的原始文件。

浏览器可查看的二进制内容内联返回。包括PDF、图片、音频、视频。

其他二进制内容作为附件流式返回。

`download=true`时的行为说明如下。

本接口始终以附件方式返回不可变的原始字节。附件文件名是原始文件名。转换后的markdown伴随文件只用于预览。下载格式不会因为代理读取过而改变。

活跃内容说明如下。

HTML和XML家族的内容始终强制为附件。包括`+xml`子类型。这样脚本永远不会在应用源上执行。

响应头说明如下。

- `Content-Type`：文件的媒体类型。未知类型时是`application/octet-stream`。
- `Content-Disposition`：内联或附件。由`download`参数和媒体类型决定。
- `X-Content-Type-Options`：值为`nosniff`。声明的PDF或图片不会被重新解释为HTML。

原始字节缺失或大小不匹配时返回409。错误详情是`content_missing`。源码不会返回空内容或替换内容。

## curl命令

```bash
curl -s "http://localhost:8001/api/projects/p_123/documents/doc_001/content?download=false" \
  -H "Authorization: Bearer <token>" \
  -o output.md
```

session cookie方式的curl命令如下。

```bash
curl -s "http://localhost:8001/api/projects/p_123/documents/doc_001/content?download=true" \
  -H "Cookie: access_token=<token>" \
  -o output.md
```
