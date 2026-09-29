# ConsoleStatsResponse档案

类定义在backend/app/gateway/routers/console.py。

## 一、这个类是干什么的

这个类是控制台统计的响应体。

控制台是运营仪表盘的数据层。用户想看自己的运行总数、对话数、token消耗和费用。

前端调用GET /api/console/stats接口。后端用这个类返回头条计数。这个类是一个Pydantic模型。

## 二、类的成员

这个类有8个字段。

### 1、total_runs

total_runs是当前用户的所有运行总数。这个字段是整数类型。这个字段必填。

### 2、active_runs

active_runs是活跃运行数。包括pending和running。这个字段是整数类型。这个字段必填。

### 3、failed_runs

failed_runs是失败运行数。包括error和timeout。这个字段是整数类型。这个字段必填。

### 4、total_threads

total_threads是当前用户的对话总数。这个字段是整数类型。这个字段必填。

### 5、total_agents

total_agents是当前用户的自定义Agent总数。这个字段是整数类型。这个字段必填。

### 6、total_tokens

total_tokens是所有运行的token消耗总数。这个字段是整数类型。这个字段必填。

### 7、total_cost

total_cost是估算费用。

这个字段是浮点数类型。默认是None。

没有配置模型定价时为None。费用按每次运行的token用量估算。

### 8、currency

currency是显示货币。

这个字段是字符串类型。默认是None。

取值来自第一个配置的定价条目。

## 三、它和谁协作

这个类被GET /api/console/stats路由使用。

数据直接查询runs和threads_meta表。这是一个报表层。不需要新的RunStore方法。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是5分。

理由如下。

控制台是跨对话的可观测性入口。这个类是仪表盘的头条数据。

费用估算和货币字段支持运营决策。

这个类只是数据聚合的载体。所以评5分。
