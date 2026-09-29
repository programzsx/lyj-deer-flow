# AttachDocumentResponse档案

类定义在backend/app/gateway/routers/project_documents.py。

## 一、这个类是干什么的

这个类是把对话附件存入文档架的响应体。

对话上传的文件可以同步存入项目文档架。摄取成功后才返回这个响应。

这个类描述保存后的文件。这个类是一个Pydantic模型。

## 二、类的成员

这个类有4个字段。

### 1、filename

filename是保存后的文件名。这个字段是字符串类型。这个字段必填。

### 2、size_bytes

size_bytes是文件字节大小。这个字段是整数类型。这个字段必填。

### 3、virtual_path

virtual_path是文件的虚拟路径。这个字段是字符串类型。这个字段必填。

### 4、artifact_url

artifact_url是文件的产物接口地址。这个字段是字符串类型。这个字段必填。

前端用这个地址下载文件。

## 三、它和谁协作

这个类被项目文档架的附件摄取路由使用。

摄取成功后才返回。摄取失败返回错误。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只有4个字段。这个类只是保存结果的载体。

摄取逻辑在路由和上传服务里。

所以评3分。
