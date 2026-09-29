# ProjectListResponse档案

类定义在backend/app/gateway/routers/projects.py。

## 一、这个类是干什么的

这个类是列出项目的响应体。

前端调用GET /api/projects接口。前端想看到项目列表。

后端用这个类把项目列表打包返回。这个类是一个Pydantic模型。

这个类是一个简单的列表容器。

## 二、类的成员

这个类有1个字段。

### 1、projects

projects是项目列表。

这个字段类型是ProjectResponse列表。这个字段必填。

列表支持按状态过滤。可以只看active。可以只看archived。不传状态看全部。

## 三、它和谁协作

这个类被GET /api/projects路由使用。

这个类作为list_projects函数的response_model。

列表内容由ProjectRepository的list方法读取。再逐个转成ProjectResponse。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只是一个列表容器。这个类只有1个字段。

实际信息都在ProjectResponse里。

所以评3分。
