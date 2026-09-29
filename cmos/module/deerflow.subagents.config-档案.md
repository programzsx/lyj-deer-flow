# deerflow.subagents.config-档案

## 一、这个模块是干什么的

这个模块定义子代理的配置数据结构。

一个子代理是一个可被主代理委派任务的代理。子代理有自己的名字、说明、系统提示、工具限制、模型、轮次预算。

这个模块定义SubagentConfig数据类。还提供模型名解析函数。

## 二、模块里的主要成员

### 1、SubagentConfig数据类

SubagentConfig装一个子代理的全部配置。

字段如下。

- name。name是子代理的唯一标识。
- description。description是给主代理看的委派时机说明。主代理据此决定什么时候委派。
- system_prompt。system_prompt是子代理的系统提示。指导子代理的行为。
- tools。tools是可选的工具名允许列表。None表示继承全部工具。
- disallowed_tools。disallowed_tools是可选的工具拒绝列表。默认值是["task"]。子代理默认不能再委派任务。防止无限嵌套。
- skills。skills是可选的技能名列表。None表示所有启用的技能可用。空列表表示这个子代理禁用技能。技能正文和allowed-tools策略只在运行时激活或加载后生效。
- model。model是要用的模型。"inherit"表示用父代理的模型。默认是"inherit"。
- max_turns。max_turns是最大代理轮次。一轮是一次模型调用加它运行的工具。内置代理用这里设的值。general-purpose是150。bash是60。turn_budget模块把这个值换算成LangGraph的recursion_limit。
- timeout_seconds。timeout_seconds是执行时间上限。内置代理的实际上限是全局subagents.timeout_seconds。默认1800秒。这里默认900只在没有不同的全局值时生效。
- prompt_overlay。prompt_overlay是操作员加在完整系统消息前后的指令。

### 2、_default_model_name函数

这个函数返回配置里第一个模型的名字。

没有任何模型配置时抛ValueError。提示至少要配置一个模型。

### 3、resolve_subagent_model_name函数

这个函数解析子代理实际应该用的模型名。

解析顺序是三步。配置的model不是"inherit"就直接用配置值。配置是inherit且父模型名不为None就用父模型。父模型也没有就从app_config取默认模型。

延迟导入get_app_config。配置传None时才加载全局配置。这样单元测试可以不依赖配置文件。

## 三、它和谁协作

registry模块用SubagentConfig表示查找到的子代理定义。内置代理、config.yaml自定义代理、托管定义都转换成SubagentConfig。

executor用SubagentConfig构建子代理。读config.tools做工具过滤。读config.max_turns算轮次预算。读config.system_prompt拼系统消息。

config模块的subagents配置提供custom_agents和覆盖项。

PromptOverlay来自config.prompt_overlay。

## 四、重要性评级

评级是6分（满分10分）。

理由：

SubagentConfig是子代理系统的配置语言。registry、executor、batch_service都用它。

默认值有安全考量。disallowed_tools默认拒绝task。防止子代理再委派。model默认inherit。让子代理跟随父代理。

模型解析的延迟导入设计让单元测试可以脱离配置文件。

它主要是数据定义。逻辑量小。给6分。
