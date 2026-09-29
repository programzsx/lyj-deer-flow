# SubagentsListResponse档案

类定义在backend/app/gateway/routers/subagents.py。

## 一、这个类是干什么的

这个类是列出子Agent的响应体。

前端调用GET /api/subagents接口。前端要展示子Agent目录。

后端用这个类把子Agent列表打包返回。这个类是一个Pydantic模型。

## 二、类的成员

这个类有1个字段。

### 1、subagents

subagents是子Agent列表。

这个字段类型是SubagentResponse列表。这个字段必填。

列表按名称和来源排序。内置的排最前。

## 三、它和谁协作

这个类被GET /api/subagents路由使用。

这个类作为list_subagents函数的response_model。

由_catalog函数构建。系统提示词只对管理员可见。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只是一个列表容器。这个类只有1个字段。

实际信息都在SubagentResponse里。

所以评3分。
