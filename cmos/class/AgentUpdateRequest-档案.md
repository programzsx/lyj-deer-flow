# AgentUpdateRequest档案

类定义在backend/app/gateway/routers/agents.py。

## 一、这个类是干什么的

这个类是更新自定义Agent的请求体。

用户想修改已有Agent的配置。用户调用PUT /api/agents/{name}接口。

这个类是一个Pydantic模型。这个类的所有字段都是可选的。

这个类有一个重要设计。省略字段表示保留原值。显式传None表示清除原值。两者含义不同。

## 二、类的成员

这个类有11个字段。所有字段都可选。

### 1、display_name

display_name是更新后的显示名称。默认是None。传None清除显示名称。

### 2、description

description是更新后的描述。默认是None。

### 3、model

model是更新后的模型覆盖。默认是None。

显式设置时路由会校验模型名。

### 4、tool_groups

tool_groups是更新后的工具组白名单。默认是None。

### 5、mcp_plugins

mcp_plugins是更新后的MCP插件选择。默认是None。

### 6、knowledge_scope

knowledge_scope是更新后的知识范围。默认是None。

### 7、skills

skills是更新后的技能白名单。默认是None。

注意None的含义。省略表示不修改。显式None表示继承全部技能。空列表表示不用技能。

### 8、allowed_subagents

allowed_subagents是更新后的子Agent白名单。默认是None。

### 9、model_settings

model_settings是更新后的采样参数覆盖。默认是None。

块内省略的子字段保留原值。块内显式None清除该子项。这样可以只改temperature而保留max_tokens。

### 10、thinking_enabled

thinking_enabled是更新后的思考模式默认值。默认是None。

### 11、reasoning_effort

reasoning_effort是更新后的推理力度默认值。取值low、medium、high。默认是None。

### 12、soul

soul是更新后的SOUL.md内容。默认是None。传None不动SOUL.md。

## 三、它和谁协作

这个类被PUT /api/agents/{name}路由使用。

这个类作为update_agent函数的body参数。

路由需要agents:write权限。路由用model_fields_set区分省略和显式None。这对skills字段特别关键。

路由还会保留不管理的字段。例如github绑定。防止更新描述时悄悄删掉手动写的github配置。

Agent不存在返回404。Agent只在旧共享布局存在返回409。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是6分。

理由如下。

更新Agent是自定义能力的高频操作。这个类的省略和None语义设计直接影响数据安全。

没有这个区分。更新一个字段会意外清除其他字段。

这个类是数据容器。合并逻辑在路由函数里。所以评6分。
