# ProjectCreateRequest档案

类定义在backend/app/gateway/routers/projects.py。

## 一、这个类是干什么的

这个类是创建项目的请求体。

用户想新建一个项目来组织对话。用户要提供项目名称和可选说明。

前端调用POST /api/projects接口。后端用这个类接收创建信息。这个类是一个Pydantic模型。

## 二、类的成员

这个类有3个字段。

### 1、name

name是项目名称。

这个字段是字符串类型。这个字段必填。

名称最短1个字符。最长128个字符。

### 2、instructions

instructions是项目说明。

这个字段是字符串类型。默认是空字符串。

路由会校验说明长度。上限来自配置的instructions_max_bytes。按UTF-8字节数计算。超长返回422。超长不截断。

### 3、presentation

presentation是项目的展示配置。

这个字段是字典类型。默认是空字典。

## 三、它和谁协作

这个类被POST /api/projects路由使用。

这个类作为create_project函数的body参数。

路由需要projects:write权限。创建成功返回201。

数据写入ProjectRepository。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

创建项目是项目功能的入口操作。这个类是项目的初始数据来源。

instructions字段有长度校验设计。按字节计算照顾多字节字符。

这个类本身只是数据容器。所以评4分。
