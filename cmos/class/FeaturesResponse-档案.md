# FeaturesResponse档案

类定义在backend/app/gateway/routers/features.py。

## 一、这个类是干什么的

这个类是前端功能开关清单的响应体。

前端启动时需要知道哪些功能可用。前端调用GET /api/features接口获取清单。

后端用这个类把所有功能开关打包返回。前端根据清单决定显示哪些UI。前端避免发出后端会拒绝的请求。

这个类是一个Pydantic模型。这个类是6个子Feature类的容器。

## 二、类的成员

这个类有6个字段。每个字段是一个子Feature类。

### 1、agents_api

agents_api是自定义Agent管理功能的开关。类型是AgentsApiFeature。

### 2、browser_control

browser_control是实时浏览器控制功能的开关。类型是BrowserControlFeature。

### 3、mcp_tasks

mcp_tasks是MCP持久任务运行时的开关。类型是McpTasksFeature。

### 4、subagent_batches

subagent_batches是子Agent批处理能力的开关。类型是SubagentBatchesFeature。

### 5、conversation_references

conversation_references是对话引用功能的开关。类型是ConversationReferencesFeature。

### 6、knowledge_base

knowledge_base是知识库范围选择功能的开关。类型是KnowledgeBaseFeature。

### 7、字段的取值来源分两类

一类是配置型开关。配置型开关读取热更新的配置。配置修改后下一次请求生效。agents_api和conversation_references属于这类。

另一类是启动型能力。启动型能力报告运行时实际启动的状态。mcp_tasks和subagent_batches属于这类。

## 三、它和谁协作

这个类被GET /api/features路由使用。

这个类作为list_features函数的response_model。

这个类聚合了6个子Feature类。子Feature类都定义在同一个文件里。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是5分。

理由如下。

这个类是前后端功能协商的唯一通道。每个前端会话启动时都要读它。

这个类组织了6个功能维度。这个类让前端可以做统一的功能门控。

这个类只是只读聚合。没有业务逻辑。所以评5分。
