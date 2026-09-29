# RestoreRequest档案

类定义在backend/app/gateway/routers/trash.py。

## 一、这个类是干什么的

这个类是恢复回收站文档的请求体。

用户想把回收站里的文档恢复到某个项目。用户可以指定目标项目。

前端调用POST /api/trash/documents/{id}/restore接口。后端用这个类接收目标。这个类是一个Pydantic模型。

这个类的字段是可选的。不传时后端用文档的来源项目提示。

## 二、类的成员

这个类有1个字段。

### 1、project_id

project_id是恢复的目标项目编号。

这个字段是字符串类型。默认是None。

不传时后端尝试恢复到来源项目。来源项目已删除或已归档时必须传这个字段。否则返回404。

## 三、它和谁协作

这个类被POST /api/trash/documents/{document_id}/restore路由使用。

这个类作为restore_trash_document函数的body参数。body本身可以为None。

路由需要projects:write权限。恢复到别人的项目返回404。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只有1个字段。这个类只是目标项目的载体。

恢复的逻辑判断在路由函数里。

所以评3分。
