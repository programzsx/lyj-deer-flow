# ManagedSubagentUpdateRequest档案

类定义在backend/app/gateway/routers/subagents.py。

## 一、这个类是干什么的

这个类是更新托管子Agent的请求体。

管理员想修改托管子Agent的定义。管理员调用PUT /api/subagents/{name}接口。

这个类是一个Pydantic模型。这个类的所有字段都是可选的。省略的字段保留原值。

## 二、类的成员

这个类有9个字段。所有字段都可选。

### 1、display_name

display_name是更新后的显示名称。默认是None。

### 2、description

description是更新后的描述。默认是None。最短1个字符。

### 3、system_prompt

system_prompt是更新后的系统提示词。默认是None。最短1个字符。

### 4、tools

tools是更新后的允许工具列表。默认是None。

### 5、disallowed_tools

disallowed_tools是更新后的不允许工具列表。默认是None。

### 6、skills

skills是更新后的技能列表。默认是None。

### 7、model

model是更新后的模型。默认是None。

### 8、max_turns

max_turns是更新后的最大轮数。默认是None。最小1。

### 9、timeout_seconds

timeout_seconds是更新后的超时秒数。默认是None。最小1。

### 10、enabled

enabled是更新后的启用状态。默认是None。

## 三、它和谁协作

这个类被PUT /api/subagents/{name}路由使用。

路由需要管理员权限。更新用exclude_unset保留省略字段。更新后重新校验。因为model_copy不重新运行校验。

另一个管理员同时删除时返回404。不泄漏成500。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只有9个可选字段。合并和校验逻辑在路由函数里。

这个类是常规的更新请求容器。所以评3分。
