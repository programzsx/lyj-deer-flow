# ConversationReferencesFeature档案

类定义在backend/app/gateway/routers/features.py。

## 一、这个类是干什么的

这个类是对话引用功能的可用性标记。

用户可以让一次运行显式引用其他对话。运行请求里可以带conversation_references字段。

这个功能需要先配置read_conversation工具。工具没配置时这个功能不可用。

前端调用GET /api/features接口。前端用这个类判断要不要显示对话引用的入口。这个类是一个Pydantic模型。

这个类是FeaturesResponse的组成部分。

## 二、类的成员

这个类有2个字段。

### 1、enabled

enabled表示运行请求是否可以带conversation_references字段。

这个字段是布尔类型。这个字段必填。

取值来自conversation_references_enabled函数。函数检查read_conversation工具是否已配置。

这个判断和运行准入的判断是同一个。配置热更新后立即生效。不需要重启。

### 2、max_references

max_references是一次运行请求最多接受的对话引用数量。

这个字段是整数类型。这个字段必填。

取值来自常量MAX_CONVERSATION_REFERENCES。

## 三、它和谁协作

这个类被GET /api/features路由使用。

这个类作为FeaturesResponse的conversation_references字段类型。

这个类继承了Pydantic的BaseModel。

数据来源是app.gateway.conversation_access模块和app.gateway.run_models模块。

## 四、重要性评级

评分是3分。

理由如下。

这个类只有2个字段。这个类是功能开关的载体。

判断逻辑在conversation_access模块里。

这个字段的意义是保持前端和后端准入逻辑一致。所以这个类有基础作用。
