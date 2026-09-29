# deerflow.tools.builtins.update_agent_tool-档案

## 一、这个模块是干什么的

这个文件定义update_agent工具。

这个工具让自定义agent持久化自我更新。

更新写入自己的SOUL.md和配置。

只有自定义agent的聊天里绑定这个工具。

绑定条件是runtime.context的agent_name已设置。

默认agent看不到这个工具。

引导流程用setup_agent。

## 二、模块里的主要成员

### 1、update_agent工具

工具接受可选字段。

soul是完整替换的SOUL.md内容。

没有补丁语义，总是完整替换。

description是新的描述。

skills是技能白名单。

空列表禁用全部技能。

省略保持不变。

tool_groups是工具组白名单。

model是模型覆盖。

必须匹配配置的模型名。

#### （1）webhook防护

工具拒绝不可信渠道。

_UNTRUSTED_CHANNELS是github渠道。

lead-agent工厂已经不给webhook渠道这个工具。

工具内再镜像一次渠道集合。

防的是自定义工厂重新挂上这个工具的情况。

webhook渠道的评论来自任何GitHub用户。

自我变更请求必须来自操作者信任的面。

#### （2）参数校验

校验有这些。

一个字段都没给就报错。

提示省略字段而不是传null字样。

null、none、undefined这些字符串被规范化成None。

soul是空或纯空白就报错。

否则agent会清空自己的个性还报告成功。

agent_name缺失报错。

引导流程要用setup_agent。

model不在配置里就报错。

否则运行时会静默回退到默认模型。

#### （3）旧布局检查

agent只存在于旧共享布局时报错。

检查的是config.yaml而不是裸目录存在。

原因是只有memory.json的目录也算存在。

不检查会让工具fork出一份新配置。

这种旧agent要先跑迁移脚本。

#### （4）字段合并

更新的字段合并进现有配置。

name强制写目录对应的名字。

description、model、tool_groups、skills按显式传入的更新。

省略的字段保留现有值。

_UI_OWNED_CONFIG_FIELDS是UI拥有的字段。

这些字段不暴露为LLM参数。

但重写配置时必须带下去。

这些字段是model_settings、thinking_enabled、reasoning_effort、allowed_subagents。

不带下去，agent调整描述时就会丢掉模型默认值或子智能体策略。

preserve_non_managed_fields保留工具不管理的所有顶层字段。

比如github配置块。

这个辅助和HTTP的PATCH路由共用。

两个面保持一致。

#### （5）持久化

配置变了或给了soul就走store的update。

数据库后端在单事务里提交两者。

文件后端逐个原子提交。

跨文件的原子性取决于后端。

### 2、变更生效时机

变更在下一轮用户消息时生效。

lead agent会用新的SOUL.md和配置重建。

## 三、它和谁协作

它依赖deerflow.config.agents_config的配置加载和字段保留。

它依赖deerflow.persistence.agents的agent存储。

它依赖deerflow.config.app_config的模型校验。

它被tools.py在agent_name设置且非引导时绑定。

## 四、重要性评级

评级是6分。

理由是这个文件实现agent的自我更新通道。

防御很完整。

webhook防护、空内容守卫、模型校验、UI字段保留。

这些防御各自对应真实的问题。

不评高分的原因是它是自定义agent专用的工具。

普通对话用不到。
