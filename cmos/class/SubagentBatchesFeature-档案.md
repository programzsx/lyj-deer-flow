# SubagentBatchesFeature档案

类定义在backend/app/gateway/routers/features.py。

## 一、这个类是干什么的

这个类是原生子Agent批处理能力的可用性标记。

子Agent批处理需要持久化存储。需要后台工作进程。需要执行槽位。这三个条件独立变化。

前端调用GET /api/features接口。前端用这个类了解这三个条件各自的状态。这个类是一个Pydantic模型。

这个类是FeaturesResponse的组成部分。

## 二、类的成员

这个类有4个字段。

### 1、enabled

enabled是历史兼容别名。

这个字段是布尔类型。这个字段必填。

这个字段的值和worker_running相同。保留这个字段是为了兼容老前端。

### 2、repository_available

repository_available表示持久化批处理历史是否可用。

这个字段是布尔类型。这个字段必填。

取值看app.state.subagent_batch_repo是否存在。

### 3、worker_running

worker_running表示当前Gateway进程是否在执行持久批处理工作。

这个字段是布尔类型。这个字段必填。

取值来自app.state.subagent_batches_available。

### 4、max_running

max_running是当前Gateway进程的原生子Agent执行槽位数。

这个字段是整数类型。这个字段必填。

取值来自configured_subagent_max_running函数。

### 5、字段设计的意义

repository_available和worker_running是分开的。

工作进程停止或功能禁用时。持久化的历史记录和导出功能仍然可用。把两者分开可以避免隐藏历史功能。

## 三、它和谁协作

这个类被GET /api/features路由使用。

这个类作为FeaturesResponse的subagent_batches字段类型。

这个类继承了Pydantic的BaseModel。

数据来源是app.state和deerflow.subagents.capacity模块。

## 四、重要性评级

评分是4分。

理由如下。

这个类比其他Feature类复杂。这个类区分了存储、进程、槽位三个维度。

这个字段的拆分设计解决了实际问题。历史功能不因工作进程停止而消失。

这个类仍然是只读标记。没有业务逻辑。所以评4分。
