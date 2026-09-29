# ArtifactArchiveManifestResponse档案

类定义在backend/app/gateway/routers/thread_runs.py。

## 一、这个类是干什么的

这个类是产物归档清单的响应体。

前端想下载一次运行的所有产物。下载前先要一个回执。回执告诉前端有多少文件。

后端用这个类返回文件数量。这个类是一个Pydantic模型。

这个类只有1个字段。

## 二、类的成员

这个类有1个字段。

### 1、file_count

file_count是归档里的文件数量。

这个字段是整数类型。这个字段必填。

## 三、它和谁协作

这个类被GET和POST /api/threads/{id}/runs/{rid}/artifacts/archive路由使用。

先请求清单。确认文件数量。再请求实际的ZIP归档。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是2分。

理由如下。

这个类只有1个字段。这个类只是文件计数器的载体。

归档打包逻辑在路由函数里。

所以评2分。
