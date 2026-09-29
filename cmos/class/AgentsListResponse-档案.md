# AgentsListResponse档案

类定义在backend/app/gateway/routers/agents.py。

## 一、这个类是干什么的

这个类是列出所有自定义Agent的响应体。

前端调用GET /api/agents接口。前端想看到所有可用的自定义Agent。

后端用这个类把Agent列表打包返回。这个类是一个Pydantic模型。

这个类是一个简单的列表容器。这个类只有1个字段。

## 二、类的成员

这个类有1个字段。

### 1、agents

agents是自定义Agent的列表。

这个字段类型是AgentResponse列表。这个字段必填。

列表里的每个元素是一个完整的Agent信息。包括名称、描述、模型覆盖、工具组等。

读取时会附带每个Agent的SOUL.md内容。

## 三、它和谁协作

这个类被GET /api/agents路由使用。

这个类作为list_agents函数的response_model。

列表内容由list_custom_agents函数读取。再逐个转成AgentResponse。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只是一个列表容器。这个类只有1个字段。

实际信息都在AgentResponse里。这个类只负责打包。

所以评3分。
