# ThreadTokenUsageModelBreakdown档案

类定义在backend/app/gateway/routers/thread_runs.py。

## 一、这个类是干什么的

这个类是按模型分组的token用量模型。

对话要展示每个模型用了多少token。每个模型的用量用这个类表示。

这个类是一个Pydantic模型。这个类只有2个字段。

## 二、类的成员

这个类有2个字段。

### 1、tokens

tokens是这个模型的token消耗总数。这个字段是整数类型。默认是0。

### 2、runs

runs是使用这个模型的运行数。

这个字段是整数类型。默认是0。

一次运行可能用多个模型。计数不互斥。

## 三、它和谁协作

这个类被GET /api/threads/{id}/token-usage路由使用。

这个类作为ThreadTokenUsageResponse的by_model字段值类型。字典的键是模型名称。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只有2个字段。这个类是用量拆分的载体。

对话级token用量展示靠它。

所以评3分。
