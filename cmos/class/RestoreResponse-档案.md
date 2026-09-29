# RestoreResponse档案

类定义在backend/app/gateway/routers/trash.py。

## 一、这个类是干什么的

这个类是恢复回收站文档的响应体。

恢复完成后。后端用这个类告诉前端两种结果。文档恢复到了新地方。文档合并到了已有文档。

这个类是一个Pydantic模型。

## 二、类的成员

这个类有2个字段。

### 1、outcome

outcome是恢复结果。

这个字段只有2个合法值。

restored表示文档已恢复。merged表示目标项目已有内容相同的文档。回收站条目消失。活跃文档保留。

### 2、document

document是恢复后的文档。

这个字段类型是ProjectDocumentResponse。这个字段必填。

## 三、它和谁协作

这个类被POST /api/trash/documents/{document_id}/restore路由使用。

这个类作为restore_trash_document函数的response_model。

document字段由ProjectDocumentResponse组成。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类区分了恢复和合并两种结果。前端靠outcome判断展示方式。

这个类只是结果容器。所以评3分。
