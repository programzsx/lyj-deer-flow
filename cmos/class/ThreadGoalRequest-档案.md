# ThreadGoalRequest档案

类定义在backend/app/gateway/routers/threads.py。

## 一、这个类是干什么的

这个类是设置对话目标的请求体。

用户可以给对话设置一个目标。Agent会持续朝目标推进。目标完成前Agent会自动继续。

前端调用PUT /api/threads/{id}/goal接口。后端用这个类接收目标。这个类是一个Pydantic模型。

## 二、类的成员

这个类有2个字段。

### 1、objective

objective是目标的完成条件。

这个字段是字符串类型。这个字段必填。最短1个字符。最长4000个字符。

Agent用这个条件判断任务是否完成。

### 2、max_continuations

max_continuations是自动隐藏续跑的最大轮数。

这个字段是整数类型。默认值是DEFAULT_MAX_GOAL_CONTINUATIONS。最小0。最大等于默认值。

达到轮数上限后Agent停止自动继续。调用方要求更多轮数时被限制。

## 三、它和谁协作

这个类被PUT /api/threads/{id}/goal路由使用。

目标写入对话的检查点状态。目标评估由runtime.goal模块的评估模型完成。

写入使用reserve_checkpoint_write边界。运行中的任务阻止写入。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是5分。

理由如下。

对话目标是自主推进任务的核心机制。这个类定义目标的完成条件和续跑上限。

max_continuations是硬上限。防止Agent无限续跑消耗token。

所以评5分。
