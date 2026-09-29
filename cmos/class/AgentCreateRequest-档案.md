# AgentCreateRequest档案

类定义在backend/app/gateway/routers/agents.py。

## 一、这个类是干什么的

这个类是创建自定义Agent的请求体。

用户想创建一个新的自定义Agent。用户要提供Agent的配置和SOUL.md人格内容。

前端调用POST /api/agents接口。后端用这个类接收创建信息。这个类是一个Pydantic模型。

## 二、类的成员

这个类有12个字段。

### 1、name

name是Agent的名称。

这个字段是字符串类型。这个字段必填。

名称必须匹配正则^[A-Za-z0-9-]+$。只允许字母、数字、连字符。存储时会转成小写。

### 2、display_name

display_name是可选的Unicode显示名称。

这个字段类型是AgentDisplayName。默认是None。

### 3、description

description是Agent的描述。这个字段是字符串类型。默认是空字符串。

### 4、model

model是可选的模型覆盖。

这个字段是字符串类型。默认是None。

路由会校验模型名是否已配置。未配置的模型返回422。校验失败优于运行时静默回退。

### 5、tool_groups

tool_groups是可选的工具组白名单。

这个字段是字符串列表类型。默认是None。

### 6、mcp_plugins

mcp_plugins是MCP插件安装选择。

这个字段是字符串列表类型。默认是None。None表示全部。空列表表示不用。

### 7、knowledge_scope

knowledge_scope是新对话轮次的默认RAGFlow知识范围。

这个字段类型是KnowledgeScope。默认是None。

### 8、skills

skills是可选的技能白名单。

这个字段是字符串列表类型。默认是None。None表示全部。空列表表示不用。

### 9、allowed_subagents

allowed_subagents是子Agent白名单。

这个字段是字符串列表类型。默认是None。None表示全部启用。空列表表示全部拒绝。

### 10、model_settings

model_settings是Agent级采样参数覆盖。

这个字段类型是AgentModelSettings。默认是None。

### 11、thinking_enabled

thinking_enabled是Agent级思考模式默认值。

这个字段是布尔类型。默认是None。

### 12、reasoning_effort

reasoning_effort是Agent级推理力度默认值。

这个字段取值是low、medium、high。默认是None。

### 13、soul

soul是SOUL.md内容。

这个字段是字符串类型。默认是空字符串。

SOUL.md描述Agent的人格和行为护栏。

## 三、它和谁协作

这个类被POST /api/agents路由使用。

这个类作为create_agent_endpoint函数的body参数。

路由需要agents:write权限。路由只保存调用方设置的字段。省略的字段不会写入配置。

数据写入AgentStore。创建成功返回201。Agent已存在返回409。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是6分。

理由如下。

创建Agent是自定义能力的入口操作。这个类承载Agent的全部初始行为配置。

模型、工具、技能、子Agent白名单直接决定Agent能做什么和不能做什么。

这个类是数据容器。校验逻辑在路由函数里。所以评6分。
