# TrashOrigin档案

类定义在backend/app/gateway/routers/trash.py。

## 一、这个类是干什么的

这个类是回收站条目来源信息的模型。

用户删除项目文档时。文档进入回收站。回收站记录文档是从哪个项目删掉的。

这个类记录来源项目的编号和名称。这个类是一个Pydantic模型。

## 二、类的成员

这个类有2个字段。

### 1、project_id

project_id是来源项目的编号。这个字段是字符串类型。这个字段必填。

### 2、project_name

project_name是来源项目的名称。这个字段是字符串类型。这个字段必填。

## 三、它和谁协作

这个类作为TrashDocumentResponse的trash_origin字段类型。

文档被删除时记录来源快照。恢复时用来源提示找到目标项目。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

来源信息是回收站恢复的关键。恢复时默认回到原项目。

这个类只有2个字段。

所以评3分。
