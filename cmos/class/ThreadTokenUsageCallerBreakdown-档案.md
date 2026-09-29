# ThreadTokenUsageCallerBreakdown档案

类定义在backend/app/gateway/routers/thread_runs.py。

## 一、这个类是干什么的

这个类是按调用方分组的token用量模型。

对话里的token消耗来自三个来源。主Agent。子Agent。中间件。这个类把三方用量拆开。

这个类是一个Pydantic模型。这个类只有3个字段。

## 二、类的成员

这个类有3个字段。

### 1、lead_agent

lead_agent是主Agent消耗的token。这个字段是整数类型。默认是0。

### 2、subagent

subagent是子Agent消耗的token。这个字段是整数类型。默认是0。

### 3、middleware

middleware是中间件消耗的token。这个字段是整数类型。默认是0。

## 三、它和谁协作

这个类被GET /api/threads/{id}/token-usage路由使用。

这个类作为ThreadTokenUsageResponse的by_caller字段类型。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

三方拆分支持成本归因。用户能看到子Agent花了多少token。

这个类只有3个字段。

所以评3分。
