# CronPreviewResponse档案

类定义在backend/app/gateway/routers/scheduled_tasks.py。

## 一、这个类是干什么的

这个类是cron预览的响应体。

后端算出将来几次的运行时间后。后端用这个类把结果返回给前端。

这个类是一个Pydantic模型。

## 二、类的成员

这个类有4个字段。

### 1、cron

cron是标准化后的cron表达式。这个字段是字符串类型。

### 2、timezone

timezone是时区。这个字段是字符串类型。

### 3、start_at

start_at是计算的起始参考时间。这个字段类型是datetime。

### 4、occurrences

occurrences是将来运行时间的列表。

这个字段类型是CronPreviewOccurrence列表。这个字段必填。

列表长度最多10次。

## 三、它和谁协作

这个类被POST /api/scheduled-tasks/preview-cron路由使用。

这个类作为预览函数的response_model。

occurrences字段由CronPreviewOccurrence组成。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类是cron预览的完整响应。用户配置日程前靠它确认运行时间。

这个类只是结果容器。计算逻辑在调度器模块里。

所以评3分。
