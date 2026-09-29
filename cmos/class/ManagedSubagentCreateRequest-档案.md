# ManagedSubagentCreateRequest档案

类定义在backend/app/gateway/routers/subagents.py。

## 一、这个类是干什么的

这个类是创建托管子Agent的请求体。

管理员可以创建可托管的子Agent。托管子Agent持久存储。可以编辑。可以删除。

前端调用POST /api/subagents接口。后端用这个类接收创建信息。这个类是一个Pydantic模型。

## 二、类的成员

这个类有10个字段。

### 1、name

name是子Agent名称。

这个字段是字符串类型。这个字段必填。用正则校验格式。

### 2、display_name

display_name是显示名称。这个字段是字符串类型。默认是None。

### 3、description

description是描述。

这个字段是字符串类型。这个字段必填。最短1个字符。

### 4、system_prompt

system_prompt是系统提示词。

这个字段是字符串类型。这个字段必填。最短1个字符。

### 5、tools

tools是允许的工具列表。这个字段是字符串列表类型。默认是None。

### 6、disallowed_tools

disallowed_tools是不允许的工具列表。这个字段是字符串列表类型。默认是None。

### 7、skills

skills是技能列表。这个字段是字符串列表类型。默认是None。

### 8、model

model是使用的模型。这个字段是字符串类型。默认是inherit。

路由会校验模型。inherit或已配置的模型名才合法。

### 9、max_turns

max_turns是最大对话轮数。这个字段是整数类型。默认是50。最小1。

### 10、timeout_seconds

timeout_seconds是超时秒数。这个字段是整数类型。默认是900。最小1。

### 11、enabled

enabled表示是否启用。这个字段是布尔类型。默认是true。

## 三、它和谁协作

这个类被POST /api/subagents路由使用。

路由需要管理员权限。名称和内置或配置定义冲突返回409。托管名称已存在也返回409。

数据写入ManagedSubagentStore。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

托管子Agent是子Agent系统的管理面。这个类是创建的唯一入口格式。

名称校验和冲突检查保护内置定义。

这个类是数据容器。所以评4分。
