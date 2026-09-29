# FactPatchRequest档案

类定义在backend/app/gateway/routers/memory.py。

## 一、这个类是干什么的

这个类是部分更新记忆事实的请求体。

用户想修改一条事实。用户可以只改内容。可以只改分类。可以只改置信度。

前端调用PATCH /api/memory/facts/{fact_id}接口。后端用这个类接收更新。这个类是一个Pydantic模型。

这个类的所有字段都是可选的。省略的字段保留原值。

## 二、类的成员

这个类有3个字段。所有字段都可选。

### 1、content

content是更新后的事实内容。

这个字段是字符串类型。默认是None。最短1个字符。

### 2、category

category是更新后的事实分类。

这个字段是字符串类型。默认是None。

### 3、confidence

confidence是更新后的置信度。

这个字段是浮点数类型。取值0到1。默认是None。

## 三、它和谁协作

这个类被PATCH /api/memory/facts/{fact_id}路由使用。

这个类作为update_memory_fact_endpoint函数的body参数。

路由需要memory:write权限。更新由MemoryManager的update_fact方法完成。该方法保留省略字段的原值。

事实不存在返回404。并发修改返回409。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只有3个字段。所有字段都可选。

部分更新逻辑在MemoryManager层。

所以评3分。
