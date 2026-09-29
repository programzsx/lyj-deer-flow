# ThreadFileEntry档案

类定义在backend/app/gateway/routers/project_thread_files.py。

## 一、这个类是干什么的

这个类是项目成员对话中单个文件的模型。

项目聚合视图要展示每个成员对话的文件。每个文件用这个类表示。

这个类是一个Pydantic模型。这个类只有5个字段。

## 二、类的成员

这个类有5个字段。

### 1、kind

kind是文件的类型。

这个字段只有2个合法值。upload表示上传文件。output表示产出文件。

### 2、name

name是文件名。这个字段是字符串类型。这个字段必填。

### 3、size_bytes

size_bytes是文件字节大小。这个字段是整数类型。这个字段必填。

### 4、modified_at

modified_at是文件修改时间。这个字段是字符串类型。这个字段必填。

### 5、artifact_url

artifact_url是文件的下载地址。这个字段是字符串类型。这个字段必填。

## 三、它和谁协作

这个类被GET /api/projects/{id}/thread-files路由使用。

这个类作为ThreadFileGroup的files字段元素类型。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只有5个字段。这个类是聚合视图里的文件条目。

用户发现文件靠这个类。保存到项目功能从这里发现文件。

所以评3分。
