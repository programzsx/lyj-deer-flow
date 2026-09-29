# SubagentResponse档案

类定义在backend/app/gateway/routers/subagents.py。

## 一、这个类是干什么的

这个类是子Agent定义的响应体。

DeerFlow支持子Agent。主Agent可以把任务委派给子Agent。子Agent有内置的、配置文件的、管理员托管的。

前端调用GET /api/subagents接口查看子Agent目录。后端用这个类返回每个子Agent的定义。这个类是一个Pydantic模型。

## 二、类的成员

这个类有14个字段。

### 1、name

name是子Agent的名称。这个字段是字符串类型。这个字段必填。

### 2、display_name

display_name是显示名称。这个字段是字符串类型。默认是None。

### 3、description

description是描述。这个字段是字符串类型。这个字段必填。

### 4、system_prompt

system_prompt是系统提示词。这个字段是字符串类型。默认是None。

系统提示词只对管理员可见。普通用户看不到。

### 5、tools

tools是允许的工具列表。这个字段是字符串列表类型。默认是None。

### 6、disallowed_tools

disallowed_tools是不允许的工具列表。这个字段是字符串列表类型。默认是None。

### 7、skills

skills是技能列表。这个字段是字符串列表类型。默认是None。

### 8、model

model是使用的模型。这个字段是字符串类型。默认是inherit。

inherit表示继承主Agent的模型。

### 9、max_turns

max_turns是最大对话轮数。这个字段是整数类型。默认是50。

### 10、timeout_seconds

timeout_seconds是超时秒数。这个字段是整数类型。默认是900。

### 11、enabled

enabled表示是否启用。这个字段是布尔类型。默认是true。

### 12、source

source是定义来源。

这个字段只有3个合法值。builtin表示内置。config表示配置文件。managed表示管理员托管。

### 13、editable

editable表示是否可以编辑。这个字段是布尔类型。默认是false。

只有托管子Agent可以编辑。

### 14、conflict

conflict表示名称是否和内置或配置定义冲突。这个字段是布尔类型。默认是false。

### 15、config_overrides

config_overrides是配置文件的显式覆盖。

这个字段是字典类型。默认是空字典。

## 三、它和谁协作

这个类被GET /api/subagents、POST /api/subagents、PUT /api/subagents/{name}三个路由使用。

由_catalog函数从内置、配置、托管三个来源构建。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是5分。

理由如下。

子Agent是任务委派的核心机制。这个类是子Agent定义的完整视图。

source和editable字段让前端区分可管理的子Agent。

这个类是数据容器。所以评5分。
