# GENERAL_PURPOSE_CONFIG-档案

## 一、这个类是干什么的

GENERAL_PURPOSE_CONFIG不是类。

GENERAL_PURPOSE_CONFIG是subagents/builtins/general_purpose.py里的配置实例。

它是SubagentConfig的实例。

它是通用子代理的配置。

它是内置的通用代理。

用于有界探索和行动。

它继承父代理的所有工具。tools为None。

这个模块位于backend/packages/harness/deerflow/subagents/builtins/general_purpose.py。

## 二、类的成员（字段、方法，各自做什么）

这是SubagentConfig实例。

字段如下。

- name的值是"general-purpose"。
- description是委托指导。专家工具、技能、模型或指令实质改善结果时用它。它拥有真正并行工作的独立不重叠部分时用它。有界且上下文重的调查要和lead上下文隔离时用它。工作复杂或多步不是理由。
- system_prompt是通用子代理的系统提示。指导内容包括专注完成委托任务、按需用工具、不问澄清、返回简洁摘要。
- tool_restrictions强调task工具不可用。绝不能尝试调用task或派发更多子代理。需要并行时用bash后台进程或顺序处理步骤。
- file_editing_workflow指导文件编辑。修改已有文件优先用str_replace而不是write_file。str_replace只发diff。长的新内容分段写。第一个write_file创建文件。之后用append=True逐段扩展。这避免超大单次写入的中流chunk-gap超时。这对应issue #3189。
- output_format要求完成后提供摘要、关键发现、相关文件路径、遇到的问题、引用。
- tools的值是None。继承父代理的所有工具。
- disallowed_tools的值是["task", "ask_clarification", "present_files"]。防止嵌套和澄清。
- model的值是"inherit"。
- max_turns的值是150。

## 三、它和谁协作

- SubagentConfig是它的类型。
- get_subagent_config解析时返回它。
- task_tool委托时读取它的配置。

## 四、重要性评级

评级是5分。

理由如下。

这个配置是最常用的内置子代理定义。

它的系统提示包含文件编辑工作流指导。

append=True分段写对应真实issue #3189。

但它是纯配置。

没有逻辑。

扣掉5分。
