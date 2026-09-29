# deerflow.subagents.builtins-档案

## 一、这个包是干什么的

这个包定义内置的子代理配置。

子代理是主智能体委派工作的目标。
委派需要一个目标。
目标需要配置。
配置包括提示、工具、回合上限等。

这个包提供两个开箱即用的子代理。

- general-purpose。通用子代理。
- bash。命令执行专家。

这两个子代理不需要配置就能用。
它们是委托功能的基础目标。

## 二、包里的主要成员

### （一）模块__init__.py——内置注册表

这个模块收集两个内置配置。
它定义`BUILTIN_SUBAGENTS`字典。
字典按名字映射到配置。

- `"general-purpose"`映射到`GENERAL_PURPOSE_CONFIG`。
- `"bash"`映射到`BASH_AGENT_CONFIG`。

注册表是只读约定的来源。
注册表覆盖不能修改`BUILTIN_SUBAGENTS`。
覆盖用replace生成新配置。

### （二）模块general_purpose.py——通用子代理

`GENERAL_PURPOSE_CONFIG`是通用子代理的配置。

#### 1、委派时机

description定义什么时候用这个子代理。

- 它的 specialist工具、技能、模型或指令能显著改善结果。
- 它拥有一个独立不重叠的真正并行工作部分。
- 有界的上下文密集调查应该和主上下文隔离。

不应该用的时机。

- 仅仅因为工作复杂或多步。
- 仅仅因为是顺序工作。
- 会重复仓库发现或重叠副作用。

#### 2、系统提示

系统提示定义子代理的行为。

guidelines部分。

- 专注于高效完成委派的任务。
- 按需使用可用工具。
- 逐步思考但果断行动。
- 遇到问题时在回复里清楚解释。
- 返回简洁的完成摘要。
- 不要求澄清。用提供的信息工作。

tool_restrictions部分。

- 子代理不能调用task工具。
- 绝不尝试派发进一步的子代理。
- 直接用bash、web_search、web_fetch、read_file等工具完成工作。
- 需要并行时用bash后台进程或顺序处理。

file_editing_workflow部分。

- 改已有文件优先str_replace。
- str_replace只发差异。
- 避免重发整个文件。
- 写长新内容分节。
- 第一次write_file创建文件。
- 之后用append=True分节扩展。
- 保持每次工具调用小。
- 避免超大单次写入的中途chunk-gap超时。

output_format部分。

- 简短的完成摘要。
- 关键发现或结果。
- 相关文件路径、数据或产物。
- 遇到的问题。
- 引用用`[citation:Title](URL)`格式。

working_directory部分。

- 用户上传在`/mnt/user-data/uploads`。
- 用户工作区在`/mnt/user-data/workspace`。
- 输出文件在`/mnt/user-data/outputs`。
- 工作区是默认的编码和文件IO目录。
- 优先用工作区相对路径。

#### 3、工具配置

tools是None。继承父级全部工具。
disallowed_tools拒绝task、ask_clarification、present_files。

拒绝task防止嵌套。
子代理不能再派发子代理。
拒绝ask_clarification让子代理自主完成。
拒绝present_files因为呈现文件是主智能体的职责。

model是inherit。用父级的模型。
max_turns是150。

### （三）模块bash_agent.py——命令执行专家

`BASH_AGENT_CONFIG`是bash子代理的配置。

#### 1、委派时机

description定义什么时候用这个子代理。

- 多命令工作流的日志或中间状态会明显挤占主上下文。
- 它拥有独立不重叠的shell工作，可以并行。
- 有理由的顺序命令链在一个隔离上下文里能减少协调成本。

常规git、build、test、deploy操作不是足够的委派理由。
委派和综合成本超过有界工作流时用直接bash工具。

#### 2、系统提示

guidelines部分。

- 相互依赖的命令一次执行一个。
- 独立命令并行执行。
- 报告stdout和stderr。
- 优雅处理错误。
- 默认工作区用相对路径。
- 部署配置的自定义挂载用绝对路径。
- 对破坏性操作（rm、覆盖等）谨慎。

output_format部分。

- 执行了什么。
- 结果（成功/失败）。
- 相关输出（长输出做摘要）。
- 错误或警告。

working_directory部分与通用子代理相同。

#### 3、工具配置

tools限定为沙箱工具。
bash、ls、read_file、write_file、str_replace。
disallowed_tools拒绝task、ask_clarification、present_files。
model是inherit。
max_turns是60。

## 三、它和谁协作

上游是`deerflow/subagents/registry.py`。
注册表把这两个配置作为内置目标。
运行时解析是内置优先。

上游还有lead_agent的提示。
主智能体的提示定义委派时机。
委派时机的表述要保持一致。
提示、task工具描述、两个内置角色描述三处对齐。
路由回退由测试钉住。

下游是`SubagentExecutor`。
执行器按配置组装子代理。
system_prompt变成SystemMessage。
tools和disallowed_tools变成allow/deny列表。

它和配置系统协作。
`config.yaml`的custom_agents可以添加更多子代理。
内置的优先。
同名冲突时后来的定义被排除出运行时。

## 四、重要性评级

评级：6分。

理由如下。

这个包是委派功能的基础目标。
没有它，子代理启用后没有任何默认目标。
general-purpose和bash是开箱即用的。

它被引用面中等。
约7个文件直接引用这个包。
主要集中在注册表、路由提示测试和委派逻辑。

它不是核心路径。
不启用子代理的部署不经过它。
启用子代理的部署里，这两个配置也只是配置数据。
执行逻辑在executor.py里。

它的价值是配置数据。
提示质量直接影响委派效果。
委派时机的描述和主提示保持一致。

删除它，内置子代理消失。
注册表只剩config.yaml定义。
通用委派和bash委派都失效。
但子系统不受损。

所以给6分。
