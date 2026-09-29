# MemoryConfigResponse档案

类定义在backend/app/gateway/routers/memory.py。

## 一、这个类是干什么的

这个类是记忆系统配置的响应体。

前端想知道记忆系统的配置。例如记忆是否开启。例如用什么后端。

前端调用GET /api/memory/config接口。后端用这个类返回配置。这个类是一个Pydantic模型。

这个类的设计是后端无关的。不同后端有自己的配置项。配置项都放在一个不透明的字典里。

## 二、类的成员

这个类有6个字段。

### 1、enabled

enabled表示记忆机制是否开启。

这个字段是布尔类型。这个字段必填。

这是调用点的开关。

### 2、mode

mode是记忆操作模式。

这个字段只有2个合法值。

middleware表示每轮被动总结。tool表示模型直接调用记忆工具。

### 3、injection_enabled

injection_enabled表示记忆是否注入系统提示词。

这个字段是布尔类型。这个字段必填。

### 4、shutdown_flush_timeout_seconds

shutdown_flush_timeout_seconds是Gateway优雅关闭时清空待处理记忆更新的硬预算。

这个字段是浮点数类型。单位是秒。这个字段必填。

这个值必须小于Pod的终止宽限期。

### 5、manager_class

manager_class是当前使用的记忆后端。

这个字段是字符串类型。这个字段必填。

值是后端名称或完整的类路径。

### 6、backend_config

backend_config是后端私有配置。

这个字段是字典类型。这个字段必填。

后端自己解释这个字典。DeerMem的配置项在这里。例如storage_path、max_facts。

## 三、它和谁协作

这个类被GET /api/memory/config和GET /api/memory/status两个路由使用。

status接口把配置和数据一起返回。

数据来自get_memory_config函数。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

这个类是记忆配置的完整视图。后端无关的设计让不同后端可以共存。

shutdown_flush_timeout_seconds字段关联部署预算。这个值配置错误会导致关闭时丢数据。

这个类只是配置载体。所以评4分。
