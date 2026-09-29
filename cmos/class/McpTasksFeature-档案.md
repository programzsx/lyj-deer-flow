# McpTasksFeature档案

类定义在backend/app/gateway/routers/features.py。

## 一、这个类是干什么的

这个类是MCP持久任务运行时的可用性标记。

MCP长时间运行的任务用独立的持久任务运行时处理。这个运行时在Gateway启动时创建。

前端调用GET /api/features接口。前端用这个类判断MCP任务相关UI要不要显示。这个类是一个Pydantic模型。

这个类只有1个字段。这个类是FeaturesResponse的组成部分。

## 二、类的成员

这个类有1个字段。

### 1、enabled

enabled表示MCP持久任务接口和UI是否可用。

这个字段是布尔类型。这个字段必填。

取值来自app.state.mcp_tasks_available。这个值在Gateway启动时写入。

注意这个字段报告的是实际启动的能力。这个字段不读热更新的配置值。因为MCP任务绑定是启动时创建的。改配置需要重启Gateway才生效。

## 三、它和谁协作

这个类被GET /api/features路由使用。

这个类作为FeaturesResponse的mcp_tasks字段类型。

这个类继承了Pydantic的BaseModel。

数据来源是FastAPI应用实例的app.state。

## 四、重要性评级

评分是3分。

理由如下。

这个类只是一个功能开关的载体。这个类只有1个字段。

这个字段的设计有意义。它区分了启动时能力和热更新配置。避免前端看到还没生效的配置。

但这个类本身非常简单。所以评3分。
