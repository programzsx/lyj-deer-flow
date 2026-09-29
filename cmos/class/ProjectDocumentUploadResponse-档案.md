# ProjectDocumentUploadResponse档案

类定义在backend/app/gateway/routers/project_documents.py。

## 一、这个类是干什么的

这个类是项目文档上传的响应体。

用户往项目文档架上传一个文件。后端保存完之后用这个类返回结果。

这个类区分两种情况。文档是新建的。文档是去重命中的。这个类是一个Pydantic模型。

## 二、类的成员

这个类有2个字段。

### 1、document

document是上传后的文档。

这个字段类型是ProjectDocumentResponse。这个字段必填。

### 2、deduplicated

deduplicated表示是否是去重命中。

这个字段是布尔类型。这个字段必填。

同一项目里已有内容相同的文档时。上传去重。返回已有的那条。状态码是200。新建的返回201。

## 三、它和谁协作

这个类被POST /api/projects/{id}/documents路由使用。

这个类作为上传函数的response_model。

document字段由ProjectDocumentResponse组成。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只是上传结果的容器。去重标记有实际作用。前端靠它区分提示语。

实际文档信息都在ProjectDocumentResponse里。

所以评3分。
