# ThreadFilesResponse档案

类定义在backend/app/gateway/routers/project_thread_files.py。

## 一、这个类是干什么的

这个类是项目对话文件聚合视图的响应体。

前端调用GET /api/projects/{id}/thread-files接口。前端要看到项目所有成员对话的文件。

后端用这个类把分组和分页信息打包返回。这个类是一个Pydantic模型。

这个视图只读不存。对话删除后文件条目消失。

## 二、类的成员

这个类有3个字段。

### 1、groups

groups是对话文件分组列表。

这个字段类型是ThreadFileGroup列表。这个字段必填。

每个成员对话一个分组。每个分组列出上传和产出文件。

### 2、next_offset

next_offset是下一页的偏移量。

这个字段是整数类型。默认是None。

没有更多对话时为None。

### 3、truncated

truncated表示是否有任何分组被截断。

这个字段是布尔类型。这个字段必填。

所有分组的truncated做或运算。任何分组截断了。整个响应就报告截断。

## 三、它和谁协作

这个类被GET /api/projects/{id}/thread-files路由使用。

这个类作为list_project_thread_files函数的response_model。

groups字段由ThreadFileGroup组成。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类是文件聚合视图的顶层响应。分页和截断报告都在这里。

实际文件信息在子模型里。

所以评3分。
