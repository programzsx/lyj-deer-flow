# deerflow.agents.interaction_policy-档案

## 一、这个模块是干什么的

这个文件是lead-agent工具和提示词引导的共享交互策略。

智能体有四种运行方式。

交互模式有真人可以回答。

自主模式没有真人。

webhook模式来自代码仓库事件。

scheduled模式来自定时任务。

没有真人的运行不能等待澄清。

所以工具集和提示词要按模式调整。

这个文件就是这层策略的单一来源。

## 二、模块里的主要成员

### 1、RunInteractionMode枚举

这个枚举定义四种交互模式。

interactive是交互模式。

autonomous是自主模式。

webhook是webhook模式。

scheduled是定时任务模式。

枚举继承自StrEnum。

### 2、RunInteractionPolicy数据类

这个类是交互敏感工具和提示词引导的单一来源。

冻结的slots数据类。

只有一个mode字段。

#### （1）allows_clarification属性

只有interactive模式允许澄清。

其他模式都不允许。

#### （2）disabled_tool_names属性

允许澄清时返回空集合。

不允许澄清时返回ask_clarification。

原因是定时运行是非交互的。

不允许等待用户回答。

#### （3）thinking_guidance属性

交互模式引导模型先澄清再动手。

非交互模式引导模型从运行上下文消解歧义。

引导模型选择最低风险的可逆路径。

引导模型记录所有实质性假设。

#### （4）clarification_system属性

交互模式返回一大段澄清系统提示词。

这段提示词定义了先澄清后计划的优先级。

提示词列出了五种必须澄清的场景。

场景是缺信息、需求含糊、方案选择、危险操作、建议确认。

非交互模式返回另一段提示词。

这段提示词告诉模型没有真人可问。

webhook模式的上下文来源和自主模式不同。

webhook模式指向issue和pull request。

自主模式指向运行上下文和配置。

#### （5）clarification_reminder属性

这个属性给提示词加一行提醒。

交互和非交互各有一句。

### 3、resolve_run_interaction_policy函数

这个函数从运行时标志和渠道上下文解析策略。

合并configurable和context两个字典。

解析顺序有优先级。

显式interaction_mode优先。

无效的模式直接报错。

non_interactive是调度器的可信旧标志。

映射到scheduled模式。

channel_name是github映射到webhook模式。

disable_clarification映射到autonomous模式。

默认是interactive模式。

## 三、它和谁协作

它被lead_agent的提示词组装和工具集组装引用。

定时任务通过non_interactive标志触发scheduled策略。

webhook渠道通过channel_name触发webhook策略。

ask_clarification工具的可用性由这个策略决定。

## 四、重要性评级

评级是7分。

理由是这个文件决定无真人运行的安全行为。

定时任务和webhook运行不能卡在等待用户回答上。

这个文件让自主运行有明确的行为准则。

低风险假设最小化，高风险不猜测。

不评高分的原因是策略本身只有两个分支。

逻辑相对简单。
