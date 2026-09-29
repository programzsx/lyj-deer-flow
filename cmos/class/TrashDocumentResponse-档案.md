# TrashDocumentResponse档案

类定义在backend/app/gateway/routers/trash.py。

## 一、这个类是干什么的

这个类是回收站文档的响应体。

用户删除的文档在回收站里。前端调用GET /api/trash/documents接口展示回收站列表。

后端用这个类描述每个被删除的文档。这个类是一个Pydantic模型。

## 二、类的成员

这个类有10个字段。

### 1、id

id是回收站条目的编号。这个字段是字符串类型。这个字段必填。

### 2、name

name是文档名称。这个字段是字符串类型。这个字段必填。

### 3、size_bytes

size_bytes是文档字节大小。这个字段是整数类型。这个字段必填。

### 4、sha256

sha256是文档内容的哈希。这个字段是字符串类型。这个字段必填。

恢复时用哈希校验内容完整性。

### 5、source_thread_id

source_thread_id是来源对话编号。这个字段是字符串类型。默认是None。

### 6、source_kind

source_kind是来源类型。这个字段是字符串类型。默认是None。

### 7、source_name

source_name是来源名称。这个字段是字符串类型。默认是None。

### 8、created_at和updated_at

created_at是文档创建时间。updated_at是文档更新时间。这两个字段是字符串类型。这两个字段必填。

### 9、trashed_at

trashed_at是删除时间。这个字段是字符串类型。这个字段必填。

回收站按删除时间排序。最新删除的排最前。

### 10、trash_origin

trash_origin是来源项目信息。这个字段类型是TrashOrigin。默认是None。

## 三、它和谁协作

这个类被GET /api/trash/documents路由使用。

这个类作为TrashListResponse的documents字段元素类型。

由_to_trash_response函数从数据库行转换而来。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

回收站是可恢复删除的核心。这个类承载回收站条目的完整信息。

用户靠这个类判断要不要恢复某个文档。

这个类只是数据容器。所以评4分。
