# ProjectsConfigResponse档案

类定义在backend/app/gateway/routers/projects.py。

## 一、这个类是干什么的

这个类是项目配置的响应体。

前端需要在客户端做校验。例如说明输入框的长度上限。前端要先知道配置值。

前端调用GET /api/projects/config接口。后端用这个类返回项目配置。这个类是一个Pydantic模型。

## 二、类的成员

这个类有2个字段。

### 1、instructions_max_bytes

instructions_max_bytes是项目说明的字节上限。

这个字段是整数类型。

前端用这个值在客户端校验输入长度。后端保存时用同一个值校验。

### 2、trash_retention_days

trash_retention_days是回收站保留天数。

这个字段是整数类型。

删除的项目在回收站保留这么多天。过期后清除。

## 三、它和谁协作

这个类被GET /api/projects/config路由使用。

这个类作为get_projects_config函数的response_model。

数据来自配置文件的projects配置块。配置块不存在时用默认值。

这个路由声明在/{project_id}路由之前。避免config被当成项目编号。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只有2个字段。这个类只是配置的载体。

它的作用是让前端和后端的校验保持一致。

所以评3分。
