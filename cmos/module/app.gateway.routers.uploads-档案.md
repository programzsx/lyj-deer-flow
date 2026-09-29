# app.gateway.routers.uploads-档案

源码路径是backend/app/gateway/routers/uploads.py。

## 一、这个模块是干什么的

uploads.py是文件上传路由。

用户把文件发给智能体处理。

文件上传到线程隔离的目录里。

智能体的沙箱可以读到这些文件。

这个模块有490多行。

## 二、模块里的主要成员

路由前缀是/api/threads/{thread_id}/uploads。

### 1、端点列表

- POST ""上传一个文件。
- GET "/limits"返回上传限制。
- GET "/list"列出已上传文件。
- DELETE "/{filename}"删除一个文件。

### 2、上传管道

上传走共享摄取管道。

管道在app.gateway.upload_ingestion里。

管道负责暂存、重名检查、大小检查、可选转换。

支持PDF、PPT、Excel、Word文档。

转换用markitdown转成markdown。

转换受uploads.auto_convert_documents配置控制。

### 3、防覆盖

claim_unique_filename保证重名不覆盖。

重名文件加_N后缀。

文件提交用原子方式完成。

临时文件在提交前存在于暂存区。

### 4、沙箱可见性

文件权限设为沙箱可读。

_make_file_sandbox_readable负责设置权限。

挂载类沙箱直接看到线程目录。

非挂载类沙箱通过同步拿到文件。

### 5、限制查询

limits端点返回大小上限。

前端上传前先查限制。

## 三、它和谁协作

上游是前端聊天输入框的附件按钮。

下游是app.gateway.upload_ingestion的摄取管道。

文件存储在线程隔离目录。

沙箱通过挂载或同步读到文件。

删除线程会清理上传目录。

## 重要性评级

评级是8分。

理由如下。

文件上传是高频核心功能。

用户发文档让智能体处理，都走这个模块。

防覆盖和原子提交保证数据一致。

沙箱可见性是智能体读文件的前提。

文档转换是增值能力。

没有上传，智能体只能处理纯文本输入。

所以评级是8分。
