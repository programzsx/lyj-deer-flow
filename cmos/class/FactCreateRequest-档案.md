# FactCreateRequest档案

类定义在backend/app/gateway/routers/memory.py。

## 一、这个类是干什么的

这个类是手动创建记忆事实的请求体。

用户想手动添加一条记忆事实。用户把事实内容发给后端。

前端调用POST /api/memory/facts接口。后端用这个类接收内容。这个类是一个Pydantic模型。

## 二、类的成员

这个类有3个字段。

### 1、content

content是事实内容。

这个字段是字符串类型。这个字段必填。最短1个字符。

空内容返回校验错误。

### 2、category

category是事实分类。

这个字段是字符串类型。默认是context。

### 3、confidence

confidence是置信度。

这个字段是浮点数类型。取值0到1。默认是0.5。

## 三、它和谁协作

这个类被POST /api/memory/facts路由使用。

这个类作为create_memory_fact_endpoint函数的body参数。

路由需要memory:write权限。数据写入MemoryManager的create_fact方法。

注意创建可能失败。配置的max_facts容量策略会淘汰新事实。被淘汰时返回409。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

手动创建事实是记忆管理的辅助操作。自动提取才是主要途径。

这个类只有3个字段。

所以评3分。
