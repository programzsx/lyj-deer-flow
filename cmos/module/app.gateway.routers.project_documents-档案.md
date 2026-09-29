# app.gateway.routers.project_documents-档案

源码路径是backend/app/gateway/routers/project_documents.py。

## 一、这个模块是干什么的

project_documents.py是项目文档架API。

项目文档架是项目里的文件存放区。

用户把文件上传到项目文档架。

文档架的文件可以挂到线程上给智能体用。

这个模块有490多行。

## 二、模块里的主要成员

路由前缀是/api/projects/{project_id}/documents。

### 1、端点列表

- GET ""列出文档架。
- POST ""上传一个文件。
- POST "/from-thread"把线程文件提升进文档架。
- POST "/{document_id}/attach-to-thread/{thread_id}"把文档挂到线程。
- GET "/{document_id}/content"读取或下载文档内容。
- DELETE "/{document_id}"把文档移入回收站。

### 2、失败封闭原则

失败封闭是fail closed。

缺失或外部的项目返回404。

缺失或外部的文档返回404。

永远不返回403。

403会泄露存在性。

归档项目拒绝上传和移入回收站。

返回同样的404。

memory后端部署返回503。

### 3、上传管道

上传走共享的摄取管道。

管道在app.gateway.upload_ingestion里。

管道负责暂存、重名检查、大小检查、可选转换。

_from-thread把线程已有的文件收进文档架。

### 4、内联预览

_is_inline_viewable_mime_type判断能否内联预览。

文本和图片可以内联显示。

## 三、它和谁协作

上游是前端项目详情页。

下游是项目文档存储和app.gateway.upload_ingestion。

项目配置来自ProjectsConfig。

挂到线程后文件进入线程上传目录。

回收站路由负责被删文档的恢复。

## 重要性评级

评级是6分。

理由如下。

项目文档架是项目功能的第二阶段。

文档架让文件在项目内复用。

失败封闭原则是安全设计的样板。

404而不是403避免泄露存在性。

上传复用共享管道，边界清晰。

但项目功能是较新的功能。

核心对话不依赖文档架。

所以评级是6分。
