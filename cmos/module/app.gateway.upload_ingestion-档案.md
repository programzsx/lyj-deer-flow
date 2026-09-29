# app.gateway.upload_ingestion-档案

源码路径是backend/app/gateway/upload_ingestion.py。

## 一、这个模块是干什么的

upload_ingestion.py是共享上传摄取服务。

文件落到线程的上传目录要经过一条管道。

管道负责暂存、重名检查、大小检查、可选转换。

管道还负责沙箱同步。

这个模块拥有整条管道。

两个调用方共享这条管道。

这个模块有426行。

## 二、模块里的主要成员

### 1、ingest_chunks

ingest_chunks是摄取入口。

输入是文件块流和展示文件名。

暂存在临时文件里。

claim_unique_filename保证重名不覆盖。

大小检查按配置上限。

### 2、文档转换

uploads.auto_convert_documents控制自动转换。

转换用markitdown把文档转markdown。

转换前先复制文件描述符。

_dup_for_conversion为转换复制文件描述符。

原始文件和转换后的文件都保留。

### 3、沙箱同步

文件权限设为沙箱可读。

非挂载类沙箱通过同步拿到文件。

同步走授权的沙箱请求租约。

租约来自authz的SandboxRequestLease。

sandbox:execute被拒绝时保留宿主机上传。

拒绝时不分配沙箱。

这和普通上传行为一致。

### 4、失败清理

采集、同步、转换失败走普通上传的错误和清理行为。

_abandoned_fd的文件描述符被关闭。

清理不泄漏文件描述符。

## 三、它和谁协作

上游是两个调用方。

调用方一是routers/uploads.py的普通上传端点。

调用方二是routers/project_documents.py的挂载路由。

下游是线程上传目录和沙箱。

转换依赖markitdown。

租约走authz的SandboxRequestLease。

## 重要性评级

评级是7分。

理由如下。

这条管道是全部文件上传的核心。

普通上传和项目文档挂载共用它。

重名检查、大小检查、转换、同步都集中在这里。

管道集中意味着行为一致。

失败清理考虑了文件描述符泄漏。

但它是服务层，不是HTTP面。

体量适中。

所以评级是7分。
