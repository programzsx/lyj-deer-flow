# KnowledgeBaseFeature档案

类定义在backend/app/gateway/routers/features.py。

## 一、这个类是干什么的

这个类是知识库检索范围选择功能的可用性标记。

用户聊天时可以选择每条消息用RAGFlow检索哪个知识范围。

这个功能有多个前置条件。知识库要开启。范围选择要开启。检索工具必须是RAGFlow。

前端调用GET /api/features接口。前端用这个类判断要不要显示范围选择UI。这个类是一个Pydantic模型。

这个类是FeaturesResponse的组成部分。

## 二、类的成员

这个类有1个字段。

### 1、scope_selection_enabled

scope_selection_enabled表示聊天是否可以选择每条消息的RAGFlow检索范围。

这个字段是布尔类型。这个字段必填。

取值来自_knowledge_scope_selection_enabled函数。函数按顺序检查三个条件。

第一。knowledge_base.enabled必须为true。第二。knowledge_base.scope_selection_enabled必须为true。第三。knowledge_search工具的use必须是RAGFlow。

三个条件都满足才返回true。这个设计是失败关闭的。任何条件不满足都禁用功能。

## 三、它和谁协作

这个类被GET /api/features路由使用。

这个类作为FeaturesResponse的knowledge_base字段类型。

这个类继承了Pydantic的BaseModel。

数据来源是AppConfig配置和app.gateway.knowledge_scope_admission模块。

## 四、重要性评级

评分是3分。

理由如下。

这个类只有1个字段。这个类是功能开关的载体。

多条件检查逻辑在路由模块的私有函数里。失败关闭的设计保证了配置错误时不暴露坏功能。

但这个类本身非常简单。所以评3分。
