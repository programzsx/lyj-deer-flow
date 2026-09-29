# deerflow.subagents-档案

## 一、这个包是干什么的

这个包是子代理委托系统的核心。

主智能体有时需要把工作分出去。
分出去的工作由一个子代理执行。
子代理是独立的智能体。
子代理有自己的上下文。
子代理有自己的工具集。
子代理完成后向主智能体报告。

这个包负责委托的全过程。

- 注册表。管理可用的子代理。
- 执行器。后台执行引擎。
- 运行时。显式运行时依赖。
- 容量控制。并发上限和队列。
- 批处理。持久化的批量任务。
- 验收检查。确定性的完成标准检查。
- 上下文快照。捕获父级上下文。
- 令牌收集。统计子代理的令牌用量。
- 回合预算。把max_turns换算成递归限制。
- 事件捕获。捕获每步消息。
- 状态契约。跨语言的子代理状态协议。

这个包是DeerFlow里最大的包之一。
executor.py有10万字符以上。
acceptance_checks.py也是10万字符以上。

## 二、包里的主要成员

### （一）模块__init__.py——懒加载出口

包根懒加载重量级的执行器入口。
`SubagentExecutor`和`SubagentResult`在第一次访问时导入。
`SubagentRuntime`同样。
这让只导入轻量类型的模块不被拖累。

包根还导出`SubagentConfig`和注册表函数。

### （二）模块config.py——SubagentConfig

`SubagentConfig`是一个子代理的配置。

字段有多个。

- name。唯一标识。
- description。什么时候委派给这个子代理。
- system_prompt。子代理的系统提示。
- tools。允许的工具列表。None继承全部。
- disallowed_tools。拒绝的工具列表。
- skills。可发现可激活的技能列表。None表示全部启用技能可用。空列表表示禁用技能。
- model。用的模型。inherit用父级的模型。
- max_turns。最大回合数。一个回合是一次模型调用加它运行的工具。
- timeout_seconds。执行时间上限的兜底。
- prompt_overlay。系统消息周围的运维指令。

max_turns不是递归限制。
`turn_budget.py`把它换算成LangGraph的recursion_limit。
换算要考虑组装的中间件链的深度。

### （三）模块registry.py——注册表

注册表管理可用的子代理。

内置子代理是general-purpose和bash。
自定义子代理来自`config.yaml`的custom_agents。
托管定义来自agent_storage。
运行时解析顺序是内置优先。
然后config.yaml定义。
然后启用的托管定义。
名字冲突时后来的定义被排除出运行时。

托管定义有1秒的TTL缓存。
缓存由锁保护。

覆盖不能修改`BUILTIN_SUBAGENTS`。
注册表覆盖用replace生成新配置。

### （四）模块builtins/——内置子代理

#### 1、general-purpose子代理

通用子代理。
继承父级全部工具。
但拒绝task、ask_clarification、present_files。
拒绝task防止嵌套。
拒绝ask_clarification让子代理自主完成。
max_turns是150。

它的提示定义了文件编辑工作流。
改文件优先str_replace。
只发差异。
新建长内容分节写。
第一次write_file建文件。
之后append=True分节扩展。
保持每次工具调用小。
避免超大单次写入的中途chunk-gap超时。

#### 2、bash子代理

命令执行专家。
只有沙箱工具。
bash、ls、read_file、write_file、str_replace。
max_turns是60。

它的描述定义了委派时机。
多命令工作流的日志会挤占主上下文时委派。
独立不重叠的shell工作可以并行时委派。
常规git、build、test、deploy操作不足以委派。

### （五）模块executor.py——执行器

#### 1、SubagentExecutor类

`SubagentExecutor`是后台执行引擎。
它是这个包的核心。

执行流程分几步。

- 组装智能体。应用子代理的提示覆盖。组装工具。附加中间件。
- 构建初始状态。应用allow/deny列表。注入延迟工具。注入报告契约段。
- 提交到隔离的事件循环。普通和持久批处理的原生子代理把协程提交到一个持久的隔离循环。
- 流式执行。捕获每步消息。
- 终态化。提取最终结果。收集停止原因。标记状态。

#### 2、隔离事件循环

`_get_isolated_subagent_loop`提供持久的隔离循环。
循环在专用线程上运行。
`_submit_to_isolated_loop_in_context`复制环境ContextVar再提交。
ContextVar包括checkpoint lineage、用户身份、追踪上下文、标签、元数据。
还有LangGraph的命名空间消息流处理器。

回调边界是精细的。
`_copy_isolated_subagent_context`复制回调管理器。
只移除标记为`deerflow_loop_bound`的处理器。
`RunJournal`带这个标记。
因为它持有父循环任务和SQL存储池。
让`RunJournal`跨循环会导致重复记账和Future挂在不同循环的错误。
丢掉整个回调链会静默移除子代理的令牌帧。

#### 3、SubagentResult和状态

`SubagentStatus`枚举定义状态。
状态有PENDING、RUNNING、COMPLETED、FAILED、TIMEOUT等。
`is_terminal`判断终态。

`SubagentResult`是执行结果。
它有令牌用量、工具回执、bash执行记录。
`try_set_terminal`原子地设置终态。
状态轮询不能在回执元数据可用之前观察到终态。

#### 4、LVM错误处理

`LLMErrorHandlingMiddleware`把提供者异常转成AIMessage。
图能干净地结束。
干净的图结束不等于子代理成功。
执行器在终态化时检查最后一条助手消息。
带标记的回退映射到FAILED。
然后发task_failed和结构化错误。
只有标记是权威的。
看起来像错误的助手文字不带标记就还是正常的完成结果。

#### 5、停止原因

三个独立的轴可以提前结束子代理。

- 回合轴。max_turns计数回合。
- 令牌轴。TokenBudgetMiddleware硬停。
- 循环轴。LoopDetectionMiddleware捕获重复的工具调用。

每个守卫在per-run_id的`consume_stop_reason`上暴露自己的上限。
`_aexecute`收集每个带这个方法的中间件。
用duck typing。
执行器和守卫类没有导入耦合。
暴露第一个非None的原因。
停止原因是加法字段，不是新的状态枚举。
旧的前端和账本读取器忽略可选字段。

### （六）模块runtime.py——SubagentRuntime

`SubagentRuntime`是显式运行时依赖。
应用入口在启动时安装等价的进程全局依赖。
直接调用图工厂的集成者改为显式接收这个对象。
多个图共享一个真实的执行上限。

它持有容量控制器。
它可选持有持久批处理的worker。
批处理worker要在图构建前启动。
在应用关停时停止。

它提供`max_total_per_run`。
默认6。
配置范围1到50。

### （七）模块capacity.py——容量控制

`SubagentExecutionCapacity`是进程级的异步FIFO准入控制器。
默认3个并发运行。
有界队列。

等待者不持有调度线程。
取消和超时释放队列和槽位的所有权。

三个错误类。

- `SubagentCapacityError`。基类。
- `SubagentCapacityRejected`。队列拒绝。
- `SubagentCapacityTimeout`。等待超时。

`configure_subagent_execution_capacity`在启动时配置。
`get_subagent_execution_capacity`返回进程全局实例。

### （八）模块batch_service.py——持久批处理

`SubagentBatchService`是持久批处理的worker。
它基于租约恢复。
批处理模式只由显式的batch_task工具选择。
不从提示大小推断。

批处理走持久化的批处理/条目行。
租约的批处理服务恢复失败或超时的条目。
条目结果是有界存储的。
导出走owner-scoped的API和JSONL。

用户取消立即终态化每个未终态的条目。
清除租约。
围住陈旧的worker完成。

### （九）模块acceptance_checks.py——验收检查

这个模块在代码里检查主智能体提供的acceptance_criteria。
它在task工具的完成分支运行。
通过asyncio.to_thread offload。
失败隔离。

可判定的叶子有三种。

- `file:<path> exists|non-empty`。文件存在或非空。
- `file_written:<path>`。文件被写过。
- `tests_passed:<command>`。测试通过。

文件检查的细节很多。

- 读取通过`read_current_file_content`限定在共享线程工作区。
- 虚拟`/mnt/user-data/...`前缀和工作区相对路径先规范化。
- 远程提供者的错误返回字符串规范化为失败的检查。
- UnicodeDecodeError标记二进制交付物。
- 读取是有界的。大小先建立。
- 大小用os.stat（本地）或元数据only的stat探测（远程）。
- stat不开内容。FIFO不能阻塞父级。
- 文件必须是常规非符号链接文件。
- 包含关系用realpath规范化。
- 超出读取上限的叶子只用大小回答。
- file_written还要加一次有界的一次性字节打开探测。
- 模式000的文件stat正常但打开会EACCES。

tests_passed检查是最复杂的部分。

- 锚定到匹配的bash执行。最新匹配优先。
- 要求status=success和测试摘要形状。
- shell结构感知。物理换行分开段。续行操作符（`&&`、`||`）保持语义。
- 可执行身份是定向的。裸的可执行接受任何路径拼写。显式路径拼写的准则要求同路径的执行。
- 参数是有序子序列。环境变量赋值前缀必须精确匹配。
- 状态污染检测。前段里的export/unset是污染。
- 运行时展开（`$VAR`、`$( )`、反引号）不可证明。
- 控制流保持。`&&`需要记录的成功。`||`需要记录的失败。
- 摘要形状只在输出归属到匹配段时评估。
- 形状要求非零的passed计数。
- 否定选项（--ignore等）消耗的位置不是证据。
- shell持久会话的执行降级为UNVERIFIED。

其他任何准则都是UNVERIFIED。
绝不静默通过。

判定结果存在additional_kwargs里。
判定进入委托账本和模型可见的清单段。
调用方伪造的判定被Gateway剔除。

### （十）模块report_contract.py——报告契约

这个模块拥有提示层的文字。
文字让回执验证不失效。

- `build_report_contract_section`。要求`[rN tool_name]`引用和可验证的句柄。
- `build_acceptance_criteria_system_note`。框架拥有的指针。指出准则列表的位置和权威。
- `normalize_acceptance_criteria`。规范化准则。空转null。20条乘500字符。
- `render_acceptance_criteria_block`。渲染准则块。

准则被加到任务HumanMessage里。
子代理的SystemMessage不带准则文本。
只带指针。
准则里的自然语言注入不能获得system通道的优先级。

### （十一）模块status_contract.py——状态契约

跨语言的子代理状态协议。
`StructuredSubagentResult`是结构化结果。
`make_subagent_additional_kwargs`构造additional_kwargs。
`format_subagent_result_message`渲染结果消息。
`read_subagent_result_metadata`读取元数据。
`normalize_token_usage`规范化令牌用量。

契约由`contracts/subagent_status_contract.json`钉住。
前端有对应的类型。
两侧由契约测试钉住。

### （十二）模块step_events.py——步骤事件

`capture_new_step_messages`捕获每个新的AIMessage和ToolMessage。
捕获基于stream_mode="values"的尾部。
包括多调用ToolNode步骤的全部输出。

上下文压缩会重写messages通道。
压缩后`len(messages)`缩小到步捕获游标以下。
游标在收缩时重置到新尾部。
压缩点之后追加的步骤不会被静默丢弃。

`build_subagent_step`限制每步文本和每个工具调用的序列化args。
限制是SUBAGENT_STEP_MAX_CHARS。
超限标记truncated。
大的write_file或bash载荷不能产生无界的行。

`subagent_run_event`拒绝畸形的chunk。
缺非空task_id的拒绝。
运行中的chunk还要非负整数message_index和消息对象。
持久化记录总是满足必需的生命周期envelope。

### （十三）模块token_collector.py——令牌收集

`SubagentTokenCollector`是LangChain回调处理器。
它按子代理收集令牌用量。
每次完成的LLM响应后发布累积快照到共享的SubagentResult。
下一个task_running事件携带快照。
折叠的工作区卡片不用重新记账父级总数。

### （十四）模块turn_budget.py——回合预算

`resolve_recursion_limit`把max_turns换算成recursion_limit。
换算考虑组装的中间件链的深度。
一个中间件钩子编译成一个图节点。
逐字换算会让general-purpose损失约18个回合。
换算按真实的编译图钉住测试。

`count_turn_steps`和`count_invocation_steps`计数步数。
`find_jumping_hooks`找跳过钩子的中间件。

### （十五）模块context_snapshot.py——上下文快照

`ParentContextSnapshot`捕获父级上下文。
捕获在验证后、setup前。
保留真实的回复。
包括隐藏的澄清。
排除框架状态和不配对的调用。
不可序列化的媒体标记为省略。

原生document快照中和保留标记和输入标记。
中和发生在捕获时。
隐藏快照绕过输入净化。

### （十六）模块batch_runtime.py——批处理运行时协议

定义批处理提交的协议。
`SubagentBatchSubmitter`是协议类。
`set_subagent_batch_submitter`和`get_subagent_batch_submitter`管理进程全局提交器。
`is_subagent_batch_runtime_available`判断可用性。

### （十七）模块batch_acceptance.py——持久批处理验收

规范化可选的batch_task准则。
规范化用共享的`normalize_acceptance_criteria`。
完成条目用`acceptance_checks`检查。
带owner-scoped路径、沙箱授权、续约的客户端租约。
准入和检查共享`parse_file_criterion`。
取消时先排干阻塞读再释放租约。
可空的判定通过查询和JSONL导出持久化。
缺失准则、检查器错误、legacy行、失败的执行都不隐式接受。
验收不改变重试策略。

## 三、它和谁协作

上游是tools/builtins/task_tool.py。
task工具调用`SubagentExecutor`。
batch_task工具调用批处理服务。

上游还有lead_agent。
主智能体的提示定义委派时机。

下游是沙箱系统。
每个被准入的子代理运行带稳定的task-derived租约所有者和命令作用域。
AIO给每个作用域一个有序的持久shell会话。

它和注册表协作。
运行时解析是内置优先。
然后config.yaml。
然后托管定义。

它和状态契约协作。
`contracts/subagent_status_contract.json`是跨语言契约。
前端有对应的类型。

它和令牌系统协作。
终态的令牌用量走当前运行的ToolMessage.additional_kwargs。
从消息状态归属。
不走进程全局的提供者ID缓存。

## 四、重要性评级

评级：9分。

理由如下。

这个包是子代理委托的全部实现。
没有它，智能体不能委派工作。
不能并行处理。
不能隔离上下文。

它是核心路径的扩展。
task工具是最重要的委派机制。
约78个文件引用子代理系统。
本包是主要实现。

它承载了最多的并发语义。
容量控制、隔离循环、回调边界、租约、取消排干都在这里。
这些语义的正确性直接决定委派的可靠性。

它承载了质量保障语义。
验收检查是确定性的完成标准。
报告契约让回执验证不失效。
停止原因让守卫透明。

它不是每次运行都必经。
不启用子代理的部署不经过它。
所以不给10分。

删除它，委派功能完全消失。
task工具失效。
批处理失效。
内置子代理失效。
所有委派相关的契约失去来源。

给9分。
