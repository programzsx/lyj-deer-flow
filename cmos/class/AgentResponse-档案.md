# AgentResponse档案

类定义在backend/app/gateway/routers/agents.py。

## 一、这个类是干什么的

这个类是自定义Agent的响应体。

DeerFlow允许用户创建自定义Agent。每个Agent有自己的配置和SOUL.md人格文件。

前端调用Agent管理接口读取Agent信息。后端用这个类返回Agent详情。这个类是一个Pydantic模型。

这个类和AgentConfig配置对象一一对应。配置对象转成响应后返回给前端。

## 二、类的成员

这个类有12个字段。

### 1、name

name是Agent的名称。

这个字段是字符串类型。这个字段必填。

名称用连字符风格。例如my-agent。名称是Agent的稳定标识符。

### 2、display_name

display_name是可选的显示名称。

这个字段类型是AgentDisplayName。默认是None。

display_name可以包含Unicode字符。例如中文。name保持ASCII稳定标识。display_name负责好看的展示。

### 3、description

description是Agent的描述。这个字段是字符串类型。默认是空字符串。

### 4、model

model是可选的模型覆盖。

这个字段是字符串类型。默认是None。

None表示使用全局默认模型。指定名称时该Agent用指定模型。

### 5、tool_groups

tool_groups是可选的工具组白名单。

这个字段是字符串列表类型。默认是None。

None表示允许所有工具组。列表表示只允许列出的工具组。

### 6、mcp_plugins

mcp_plugins是MCP插件安装选择。

这个字段是字符串列表类型。默认是None。

None表示全部。空列表表示一个都不用。

### 7、knowledge_scope

knowledge_scope是新对话轮次的默认RAGFlow知识范围。

这个字段类型是KnowledgeScope。默认是None。

None表示继承运营者的范围。

### 8、skills

skills是可选的技能白名单。

这个字段是字符串列表类型。默认是None。

None表示全部技能。空列表表示不用技能。列表表示白名单。

### 9、allowed_subagents

allowed_subagents是子Agent白名单。

这个字段是字符串列表类型。默认是None。

None表示所有启用的子Agent。空列表表示全部拒绝。列表表示白名单。

### 10、model_settings

model_settings是Agent级采样参数覆盖。

这个字段类型是AgentModelSettings。默认是None。

覆盖包括temperature和max_tokens。

### 11、thinking_enabled

thinking_enabled是Agent级思考模式默认值。

这个字段是布尔类型。默认是None。

None表示使用运行时默认值。

### 12、reasoning_effort

reasoning_effort是Agent级推理力度默认值。

这个字段只有3个合法值。low、medium、high。默认是None。

## 三、它和谁协作

这个类被GET /api/agents、GET /api/agents/{name}、POST /api/agents、PUT /api/agents/{name}四个路由使用。

前两个返回Agent信息。后两个创建和更新Agent后返回这个类。

由_agent_config_to_response函数从AgentConfig转换而来。

这个类继承了Pydantic的BaseModel。

创建和更新请求的字段和这个类保持一致。三者的模型行为字段同步设计。

## 四、重要性评级

评分是6分。

理由如下。

自定义Agent是DeerFlow的核心扩展能力。这个类是Agent配置的完整视图。

这个类承载Agent的全部行为控制。模型、工具、技能、子Agent、知识范围都在这里。

这个类的字段设计直接影响Agent运行行为。所以评6分。
