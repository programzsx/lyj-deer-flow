# deerflow.subagents.builtins.general_purpose

## 一、这个模块是干什么的

这个模块定义通用子代理的配置。

背景是这样的。

主代理可以把任务委托给子代理。

通用子代理是最常用的委托目标。

它适合有边界的探索和行动。

什么时候该委托给它。

一种情况是它的专用工具、技能、模型或指令能明显改善结果。

一种情况是它拥有真正并行工作里独立不重叠的一部分。

一种情况是有边界的重上下文调查需要和主上下文隔离。

什么时候不该委托。

不能只因为工作复杂或多步就委托。

不能只因为是顺序执行就委托。

它继承主代理的全部工具。

但它不能再用task工具。

不能再嵌套委托子代理。

它还有文件编辑的守则。

改现有文件优先用str_replace。

只发diff，避免重发整个文件。

写长的新内容要分段写。

先创建文件，再用append扩展。

这避免了超大单次写入的流超时问题。

## 二、模块里的主要成员

- GENERAL_PURPOSE_CONFIG：唯一的导出。一个SubagentConfig实例。
- name是general-purpose。
- description描述何时该委托给它。主代理靠这段描述决策。
- system_prompt是系统提示词。包含执行守则、工具限制、文件编辑守则、输出格式、工作目录说明。
- tools是None，继承主代理全部工具。
- disallowed_tools禁止task、ask_clarification、present_files。
- model是inherit。
- max_turns是150。比bash子代理多。

## 三、它和谁协作

- 它被subagents/registry.py引用。注册表把它注册成内置子代理。
- 它被子代理执行器消费。
- 它依赖subagents/config的SubagentConfig类型。

## 四、重要性评级

评级是4分。

理由是它是通用委托能力的配置来源。

委托决策依赖它的描述文本。

文件编辑守则修复了真实的流超时缺陷。

工具限制保证不能嵌套委托。

但它只是配置数据，没有逻辑。
