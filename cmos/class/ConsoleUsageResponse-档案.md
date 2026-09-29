# ConsoleUsageResponse档案

类定义在backend/app/gateway/routers/console.py。

## 一、这个类是干什么的

这个类是token用量报表的响应体。

前端调用GET /api/console/usage接口。前端要展示每日token用量曲线和按模型的用量拆分。

后端用这个类返回完整用量报表。这个类是一个Pydantic模型。

## 二、类的成员

这个类有6个字段。

### 1、days

days是按天的用量序列。

这个字段类型是ConsoleUsageDay列表。这个字段必填。

序列是零填充的。没有用量的日期也有记录。

### 2、by_model

by_model是按模型的用量拆分。

这个字段是字典类型。键是模型名称。值类型是ConsoleUsageModelBreakdown。这个字段必填。

### 3、total_tokens

total_tokens是窗口内的token总数。这个字段是整数类型。这个字段必填。

### 4、total_runs

total_runs是窗口内的运行总数。这个字段是整数类型。这个字段必填。

### 5、total_cost

total_cost是窗口内的估算费用。这个字段是浮点数类型。默认是None。没有定价时为None。

### 6、currency

currency是显示货币。这个字段是字符串类型。默认是None。

## 三、它和谁协作

这个类被GET /api/console/usage路由使用。

days字段由ConsoleUsageDay组成。by_model字段由ConsoleUsageModelBreakdown组成。

数据直接查询runs表。要求SQL数据库后端。内存后端返回503。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是5分。

理由如下。

这个类是用量报表的完整数据。支持成本监控和模型归因。

混合货币会禁用费用报告。费用字段为null。而不是产生无效聚合。

所以评5分。
