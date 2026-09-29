# deerflow.agents.assembly_descriptor-档案

## 一、这个模块是干什么的

这个文件把组装好的agent投影成一个可比较的描述符。

工厂在组装时知道一些下游无法恢复的信息。

信息包括哪个模型在运行时覆盖后幸存。

信息包括渲染出的提示词实际说了什么。

信息包括工具授权留下了哪些工具。

信息包括中间件栈最终的顺序。

这个文件把这些瞬态知识转成AgentAssemblyDescriptor。

AgentAssemblyDescriptor是公共扩展契约里的类型。

两条规则塑造这个投影。

第一条是声明胜过探测。

中间件实现了release_policy_parameters就拥有自己的行为身份。

探测私有属性是兜底，并且被标记出来。

第二条是做哈希不做拷贝。

提示词和工具描述被归约成哈希。

描述符是身份，不是agent载荷的第二份拷贝。

## 二、模块里的主要成员

### 1、build_assembly_descriptor函数

这个函数描述一次完成的组装。

主要参数有这些。

namespace和agent_name标识组装。

requested_model和effective_model记录模型选择。

model_config和model_overrides记录模型参数。

thinking_enabled和reasoning_effort记录推理配置。

rendered_base_prompt是渲染的基础提示词。

tools是绑定到图的工具列表。

middlewares是中间件列表。

deferred_names是延迟工具名。

enabled_skills是启用的技能。

effective_policies是有效策略。

#### （1）技能目录哈希

技能目录被做成条目列表。

每个条目包含name、description、allowed_tools、content_hash、required_secrets。

content_hash是SKILL.md正文的摘要。

allowed_tools保留None和空列表的区别。

None表示旧的允许全部。

空列表表示不允许业务工具。

目录整体被哈希进effective_policies。

#### （2）中间件工具折叠

中间件自带的工具被折叠进工具列表。

原因是模型看到它们的方式完全一样。

#### （3）build身份

_build_identity记录构建身份。

身份包含包版本、镜像digest、git提交。

身份放在单独字段。

原因是effective_policies被哈希进指纹。

重新部署不改变agent就不能改变指纹。

### 2、describe_model_identity函数

这个函数在不序列化的情况下命名一个聊天模型。

聊天模型对象带凭据和客户端，永远不是纯数据。

身份是类名加配置的模型名。

身份会解开中间件栈叠加的bound包装。

### 3、describe_tool函数

这个函数把一个绑定工具投影成身份。

身份包含名字、描述哈希、schema哈希、来源、MCP服务器和传输。

描述和schema都经过canonical_hash归约。

### 4、describe_middleware函数

这个函数投影一个中间件。

优先用自己的声明。

没声明就用探测，并标记probed=True。

_unwrap_middleware先解开扩展的隔离包装。

原因是所有贡献的中间件共享一个动态生成的类名。

描述包装会把它们全部折叠成无法区分的描述符。

### 5、_model_parameters函数

这个函数给出模型配置中影响行为的部分。

基于配置自身的有效字段加上实际应用的覆盖。

凭据形状的字段名被排除。

不能归约成纯JSON的值被静默丢弃。

reasoning字段故意不排除。

原因是reasoning影响请求载荷。

### 6、_plain_value函数

这个函数把值归约成JSON形状的数据。

不能归约的返回None。

None表示不可描述。

None和真正的None故意不可区分。

## 三、它和谁协作

它依赖deerflow_extension_api的公共契约类型。

它依赖deerflow.tools.mcp_metadata和tool_provenance的工具来源。

它依赖deerflow.sandbox.env_policy的凭据字段判断。

它被lead_agent的组装路径调用。

观察者通过描述符观察在线的图。

## 四、重要性评级

评级是7分。

理由是这个文件让agent组装变得可观测和可比较。

描述符用于追踪、企业上下文和指纹。

凭据字段被挡在投影之外。

不评高分的原因是它只做投影。

没有它，agent照常运行，只是少了可观测性。
