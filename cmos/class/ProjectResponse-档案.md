# ProjectResponse档案

类定义在backend/app/gateway/routers/projects.py。

## 一、这个类是干什么的

这个类是项目的响应体。

DeerFlow支持用项目组织对话。一个项目有名称、说明、展示配置和状态。

前端调用项目接口读取项目信息。后端用这个类返回项目详情。这个类是一个Pydantic模型。

## 二、类的成员

这个类有7个字段。

### 1、id

id是项目的唯一编号。这个字段是字符串类型。

### 2、name

name是项目名称。这个字段是字符串类型。

### 3、instructions

instructions是项目说明。

说明会作为项目内对话的背景上下文。这个字段是字符串类型。

### 4、presentation

presentation是项目的展示配置。这个字段是字典类型。

### 5、status

status是项目状态。这个字段是字符串类型。

合法值是active和archived。active表示使用中。archived表示已归档。

### 6、created_at

created_at是创建时间。这个字段是字符串类型。

### 7、updated_at

updated_at是更新时间。这个字段是字符串类型。

## 三、它和谁协作

这个类被多个项目路由使用。

POST /api/projects创建项目。GET /api/projects/{project_id}读取单个项目。PATCH /api/projects/{project_id}更新项目。POST /api/projects/{project_id}/archive归档。POST /api/projects/{project_id}/restore恢复。

这些路由都返回这个类。

由_to_response函数从数据库行转换而来。数据库行缺字段的用默认值。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

项目是对话组织的基本单元。这个类是项目的完整视图。

前端项目列表和详情页都靠这个类展示。

这个类只是数据容器。所以评4分。
