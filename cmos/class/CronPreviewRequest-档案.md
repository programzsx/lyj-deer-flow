# CronPreviewRequest档案

类定义在backend/app/gateway/routers/scheduled_tasks.py。

## 一、这个类是干什么的

这个类是cron预览的请求体。

用户配置cron日程时想先看看将来什么时候运行。前端调用预览接口。

后端用这个类接收预览参数。这个类是一个Pydantic模型。

这是一个咨询性接口。预览不会创建任务。预览不会执行任务。

## 二、类的成员

这个类有4个字段。

### 1、cron

cron是cron表达式。

这个字段是字符串类型。这个字段必填。最长256个字符。

### 2、timezone

timezone是时区。

这个字段是字符串类型。这个字段必填。最长128个字符。

### 3、count

count是预览的次数。

这个字段是整数类型。默认是5。最小1。最大10。严格类型校验。

### 4、start_at

start_at是可选的起始参考时间。

这个字段类型是AwareDatetime。默认是None。

带时区的时间。不传用当前时间。

## 三、它和谁协作

这个类被POST /api/scheduled-tasks/preview-cron路由使用。

预览计算在asyncio.to_thread里执行。计算复用调度器自己的计算器。保证预览语义和真实调度一致。

路由需要threads:read权限。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

cron预览是配置日程时的辅助功能。这个类让用户配置前能看到运行时间。

这个类只有4个字段。预览计算逻辑在调度器模块里。

所以评3分。
