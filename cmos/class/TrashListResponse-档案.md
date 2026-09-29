# TrashListResponse档案

类定义在backend/app/gateway/routers/trash.py。

## 一、这个类是干什么的

这个类是回收站列表的响应体。

前端调用GET /api/trash/documents接口。前端要展示回收站。

后端用这个类把回收站列表和分页信息打包返回。这个类是一个Pydantic模型。

## 二、类的成员

这个类有4个字段。

### 1、documents

documents是回收站文档列表。

这个字段类型是TrashDocumentResponse列表。这个字段必填。

### 2、total

total是回收站文档总数。这个字段是整数类型。这个字段必填。

### 3、limit

limit是本次分页的每页数量。这个字段是整数类型。这个字段必填。

### 4、offset

offset是本次分页的偏移量。这个字段是整数类型。这个字段必填。

## 三、它和谁协作

这个类被GET /api/trash/documents路由使用。

这个类作为list_trash_documents函数的response_model。

列表触发回收站的保留期清理。清理失败不影响列表。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只是列表容器。这个类带分页信息。

实际文档信息都在TrashDocumentResponse里。

所以评3分。
