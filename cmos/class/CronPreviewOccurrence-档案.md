# CronPreviewOccurrence档案

类定义在backend/app/gateway/routers/scheduled_tasks.py。

## 一、这个类是干什么的

这个类是cron预览中单次运行时间的模型。

用户预览cron日程。后端算出将来几次的运行时间。每次运行时间用这个类表示。

这个类是一个Pydantic模型。这个类只有2个字段。

## 二、类的成员

这个类有2个字段。

### 1、run_at

run_at是下一次运行的时间。

这个字段类型是datetime。

这是UTC时间。

### 2、local_time

local_time是同一时刻的本地时间。

这个字段类型是datetime。

这个时间按请求里的时区转换。

## 三、它和谁协作

这个类被POST /api/scheduled-tasks/preview-cron路由使用。

这个类作为CronPreviewResponse的occurrences字段元素类型。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是2分。

理由如下。

这个类只有2个字段。这个类只是运行时间的载体。

前端同时展示UTC时间和本地时间。方便用户确认日程。

所以评2分。
