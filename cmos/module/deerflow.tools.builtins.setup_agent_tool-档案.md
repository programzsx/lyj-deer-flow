# deerflow.tools.builtins.setup_agent_tool-档案

## 一、这个模块是干什么的

这个文件定义setup_agent工具。

这个工具完成自定义agent的引导创建。

它持久化自定义agent的SOUL.md和配置。

只有引导流程绑定它。

is_bootstrap为True时工具才在工具集里。

这个工具是引导握手的一部分。

## 二、模块里的主要成员

### 1、setup_agent工具

工具接受soul和description。

soul是完整的SOUL.md内容。

SOUL.md定义agent的个性和行为。

description是一行描述。

skills是可选的技能名单。

None表示用全部启用技能。

空列表表示不用技能。

#### （1）空内容守卫

工具先拒绝空或纯空白的soul。

没有这个守卫，工具会持久化空SOUL.md还报告成功。

前端会进入agent已创建状态，agent却不可用。

问题编号是3549。

报错让模型重试。

守卫还防止全局默认SOUL.md被空内容覆盖。

#### （2）自定义agent持久化

agent_name在runtime.context里时走自定义路径。

先校验agent名。

自定义agent持久化在当前用户的桶下。

存储走配置的store，可以是文件或数据库。

setup是幂等的，所以是upsert。

已存在的记录会保留display_name。

保留knowledge_scope。

knowledge_scope经过规范化。

description和skills有值时更新。

#### （3）默认agent持久化

没有agent_name时走默认agent路径。

SOUL.md放在全局base目录。

默认agent不是自定义记录。

不管存储后端是什么都走文件。

#### （4）结果

成功返回Command。

Command更新created_agent_name和成功消息。

失败返回错误ToolMessage。

## 三、它和谁协作

它依赖deerflow.config.agents_config的名字校验。

它依赖deerflow.persistence.agents的agent存储。

它依赖deerflow.config.paths的路径。

它依赖deerflow.knowledge_scope的规范化。

它被tools.py在is_bootstrap为True时绑定。

它和update_agent_tool配合。

setup负责初始创建。

update负责后续自更新。

## 四、重要性评级

评级是6分。

理由是这个文件是自定义agent创建的入口。

自定义agent体系靠它完成握手。

空内容守卫挡住了一个真实bug。

幂等upsert保证不同节点解析同一agent。

不评高分的原因是它只在引导流程绑定。

普通对话用不到。
