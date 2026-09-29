# ConsoleUsageModelBreakdown档案

类定义在backend/app/gateway/routers/console.py。

## 一、这个类是干什么的

这个类是按模型分组的token用量模型。

控制台展示每个模型用了多少token。每个模型的用量用这个类表示。

这个类是一个Pydantic模型。这个类是ConsoleUsageResponse的组成部分。

## 二、类的成员

这个类有5个字段。

### 1、tokens

tokens是这个模型的token消耗总数。这个字段是整数类型。默认是0。

### 2、runs

runs是使用这个模型的运行数。这个字段是整数类型。默认是0。

一次运行可能用多个模型。计数不互斥。

### 3、cost

cost是这个模型的估算费用。这个字段是浮点数类型。默认是None。未定价时为None。

### 4、input_tokens

input_tokens是这个模型的输入token数。这个字段是整数类型。默认是0。

### 5、cache_read_tokens

cache_read_tokens是提示缓存命中的输入token数。这个字段是整数类型。默认是0。

缓存命中的输入计费不同。费用计算时用缓存命中价格。

## 三、它和谁协作

这个类被GET /api/console/usage路由使用。

这个类作为ConsoleUsageResponse的by_model字段值类型。字典的键是模型名称。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

按模型的用量拆分支持费用归因。cache_read_tokens字段是缓存感知计费的关键。

没有缓存命中拆分。费用估算会不准确。

所以评4分。
