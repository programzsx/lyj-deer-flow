# deerflow.subagents.builtins.bash_agent

## 一、这个模块是干什么的

这个模块定义bash子代理的配置。

背景是这样的。

主代理可以把任务委托给子代理。

子代理有独立的上下文。

bash子代理专门执行shell命令。

它是配置数据，不是执行逻辑。

执行由子代理执行器统一负责。

它的定位是命令执行专家。

适合有边界的shell工作流。

什么时候该委托给它。

一种情况是多命令工作流的日志会挤占主代理的上下文。

一种情况是它拥有独立不重叠的shell负载，可以并行跑。

什么时候不该委托。

例行的git、构建、测试、部署操作不是委托的理由。

委托和综合的成本超过收益时，直接用bash工具。

它只能用沙箱工具。

不能用task工具，不能再嵌套委托。

不能用ask_clarification，不能要求用户澄清。

不能用present_files。

模型继承主代理的模型。

## 二、模块里的主要成员

- BASH_AGENT_CONFIG：唯一的导出。一个SubagentConfig实例。
- name是bash。
- description描述何时该委托给它。主代理靠这段描述决定是否委托。
- system_prompt是子代理的系统提示词。定义执行守则和输出格式。
- tools是允许的工具。只有bash、ls、read_file、write_file、str_replace。全是沙箱工具。
- disallowed_tools是禁止的工具。task、ask_clarification、present_files。
- model是inherit，继承主代理模型。
- max_turns是60。

## 三、它和谁协作

- 它被subagents/registry.py引用。注册表把它注册成内置子代理。
- 它被子代理执行器消费。执行器按配置构建和运行子代理。
- 它依赖subagents/config的SubagentConfig类型。

## 四、重要性评级

评级是4分。

理由是它是bash委托能力的配置来源。

主代理的委托决策依赖它的描述文本。

工具限制保证子代理不能嵌套委托。

但它只是配置数据，没有逻辑。

行为问题的修复通常在执行器而不在这里。
