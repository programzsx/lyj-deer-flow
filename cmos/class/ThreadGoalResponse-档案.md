# ThreadGoalResponse档案

类定义在backend/app/gateway/routers/threads.py。

## 一、这个类是干什么的

这个类是对话目标的响应体。

前端想看对话当前的目标。前端调用GET /api/threads/{id}/goal接口。

后端用这个类返回目标状态。这个类是一个Pydantic模型。

这个类只有1个字段。

## 二、类的成员

这个类有1个字段。

### 1、goal

goal是当前的目标状态。

这个字段是字典类型。默认是None。

没有活跃目标时为None。有目标时包含目标内容和评估信息。

## 三、它和谁协作

这个类被GET /api/threads/{id}/goal路由使用。

这个类也作为PUT和DELETE目标路由的返回值。

数据来自read_thread_goal函数。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只有1个字段。这个类只是目标状态的载体。

目标逻辑在runtime.goal模块里。

所以评3分。
