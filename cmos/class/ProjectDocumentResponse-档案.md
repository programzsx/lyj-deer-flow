# ProjectDocumentResponse档案

类定义在backend/app/gateway/routers/project_documents.py。

## 一、这个类是干什么的

这个类是项目文档的响应体。

项目可以有自己的文档架。用户往项目里上传文档。文档在项目内共享。

前端调用项目文档接口读取文档信息。后端用这个类返回文档详情。这个类是一个Pydantic模型。

内部列不会离开服务端。user_id、存储路径、回收站字段都不出现在响应里。

## 二、类的成员

这个类有10个字段。

### 1、id

id是文档的唯一编号。这个字段是字符串类型。这个字段必填。

### 2、name

name是文档名称。这个字段是字符串类型。这个字段必填。

### 3、size_bytes

size_bytes是文档字节大小。这个字段是整数类型。这个字段必填。

### 4、sha256

sha256是文档内容的哈希。这个字段是字符串类型。这个字段必填。

### 5、source_thread_id

source_thread_id是来源对话编号。这个字段是字符串类型。默认是None。

### 6、source_kind

source_kind是来源类型。这个字段是字符串类型。默认是None。

### 7、source_name

source_name是来源名称。这个字段是字符串类型。默认是None。

### 8、created_at和updated_at

created_at是创建时间。updated_at是更新时间。这两个字段是字符串类型。这两个字段必填。

### 9、content_missing

content_missing表示原始文件是否丢失。

这个字段是布尔类型。默认是false。

这是读取时实时判断的。不是持久化的列。原始文件丢失或大小不匹配时为true。

## 三、它和谁协作

这个类被多个项目文档路由使用。

列表接口返回这个类的列表。读取单个文档返回这个类。上传和恢复也返回这个类。

由_to_response函数从数据库行转换而来。

这个类也被trash.py模块复用。RestoreResponse的document字段就是这个类型。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

项目文档架是项目功能的重要部分。这个类是文档的完整视图。

content_missing字段是读取时真实性的设计。完整性锚定在原始文件上。

这个类被trash模块复用。所以评4分。
