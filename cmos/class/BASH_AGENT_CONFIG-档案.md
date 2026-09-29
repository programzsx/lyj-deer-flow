# BASH_AGENT_CONFIG-档案

## 一、这个类是干什么的

BASH_AGENT_CONFIG不是类。

BASH_AGENT_CONFIG是subagents/builtins/bash_agent.py里的配置实例。

它是SubagentConfig的实例。

它是bash子代理的配置。

bash子代理是命令执行专家。

它负责有界的shell工作流。

它的描述和系统提示指导模型什么时候该委托给它。

多命令工作流的日志或中间状态会实质挤掉lead上下文时用它。

它拥有独立、不重叠、能并行运行的shell负载时用它。

常规的git、build、test、deploy操作不是委托的理由。

这个模块位于backend/packages/harness/deerflow/subagents/builtins/bash_agent.py。

## 二、类的成员（字段、方法，各自做什么）

这是SubagentConfig实例。

字段如下。

- name的值是"bash"。
- description是委托指导。告诉lead什么时候用bash子代理。
- system_prompt是bash专家的系统提示。指导内容包括依赖命令逐个执行、独立命令并行执行、报告stdout和stderr、优雅处理错误、用workspace相对路径、对破坏性操作谨慎。
- tools的值是["bash", "ls", "read_file", "write_file", "str_replace"]。只有沙箱工具。
- disallowed_tools的值是["task", "ask_clarification", "present_files"]。禁止嵌套委托和澄清。
- model的值是"inherit"。继承父模型。
- max_turns的值是60。

工作目录指导如下。

用户上传在/mnt/user-data/uploads。

用户工作区在/mnt/user-data/workspace。

输出文件在/mnt/user-data/outputs。

默认工作目录是/mnt/user-data/workspace。

优先用workspace相对路径。

部署配置的自定义挂载在别的绝对容器路径。任务引用时直接用。

## 三、它和谁协作

- SubagentConfig是它的类型。
- get_subagent_config解析时返回它。
- task_tool委托时读取它的配置。
- SubagentExecutor按配置执行。

## 四、重要性评级

评级是5分。

理由如下。

这个配置是bash子代理的定义。

它的描述指导委托决策。

disallowed_tools防止嵌套和澄清。

max_turns是60。

但它是纯配置。

没有逻辑。

扣掉5分。
