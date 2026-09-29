# ProjectPatchRequest档案

类定义在backend/app/gateway/routers/projects.py。

## 一、这个类是干什么的

这个类是部分更新项目的请求体。

用户想修改已有项目的信息。用户可以只改名称。可以只改说明。可以只改展示配置。

前端调用PATCH /api/projects/{project_id}接口。后端用这个类接收更新信息。这个类是一个Pydantic模型。

这个类的所有字段都是可选的。省略的字段表示不修改。

## 二、类的成员

这个类有3个字段。所有字段都可选。

### 1、name

name是更新后的项目名称。

这个字段是字符串类型。默认是None。

名称最短1个字符。最长128个字符。传None不修改名称。

### 2、instructions

instructions是更新后的项目说明。

这个字段是字符串类型。默认是None。

路由会校验长度。超长返回422。

### 3、presentation

presentation是更新后的展示配置。

这个字段是字典类型。默认是None。

## 三、它和谁协作

这个类被PATCH /api/projects/{project_id}路由使用。

这个类作为patch_project函数的body参数。

路由需要projects:write权限。项目不存在返回404。

数据写入ProjectRepository的patch方法。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只有3个字段。所有字段都可选。

部分更新的合并逻辑在仓库层的patch方法里。

这个类是常规的更新请求容器。所以评3分。
