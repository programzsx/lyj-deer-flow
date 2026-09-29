# ThreadFileGroup档案

类定义在backend/app/gateway/routers/project_thread_files.py。

## 一、这个类是干什么的

这个类是项目文件聚合视图中单个对话的分组模型。

一个项目有多个成员对话。每个对话贡献自己的文件。这个类表示一个对话的文件分组。

这个类是一个Pydantic模型。

## 二、类的成员

这个类有5个字段。

### 1、thread_id

thread_id是成员对话的编号。这个字段是字符串类型。这个字段必填。

### 2、display_name

display_name是对话的显示名称。这个字段是字符串类型。默认是None。

### 3、updated_at

updated_at是对话的更新时间。这个字段是字符串类型。这个字段必填。

### 4、files

files是这个对话的文件列表。

这个字段类型是ThreadFileEntry列表。这个字段必填。

### 5、truncated

truncated表示文件列表是否被截断。

这个字段是布尔类型。这个字段必填。

单个对话的文件数有上限。超过上限的列表被截断。截断一定报告。不会静默截断。

## 三、它和谁协作

这个类被GET /api/projects/{id}/thread-files路由使用。

这个类作为ThreadFilesResponse的groups字段元素类型。

files字段由ThreadFileEntry组成。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类是文件聚合视图的分组单元。truncated字段保证截断透明。

这个类本身只是容器。

所以评3分。
