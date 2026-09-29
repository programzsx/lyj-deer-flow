# FeedbackStatsResponse档案

类定义在backend/app/gateway/routers/feedback.py。

## 一、这个类是干什么的

这个类是反馈统计的响应体。

前端想展示一次运行收到了多少好评和差评。前端调用GET /api/threads/{thread_id}/runs/{run_id}/feedback/stats接口。

后端用这个类返回聚合统计。这个类是一个Pydantic模型。这个类只承载数据。

## 二、类的成员

这个类有4个字段。

### 1、run_id

run_id是统计所属的运行编号。这个字段是字符串类型。

### 2、total

total是反馈总数。这个字段是整数类型。默认是0。

### 3、positive

positive是好评数量。这个字段是整数类型。默认是0。

### 4、negative

negative是差评数量。这个字段是整数类型。默认是0。

total等于positive加negative。

## 三、它和谁协作

这个类被GET /api/threads/{thread_id}/runs/{run_id}/feedback/stats路由使用。

这个类作为feedback_stats函数的response_model。

聚合计算由FeedbackRepository的aggregate_by_run方法完成。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只是统计结果的响应容器。这个类只有4个简单字段。

聚合逻辑在仓库层。这个类不做任何计算。

所以评3分。
