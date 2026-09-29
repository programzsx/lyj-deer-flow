# ThreadState档案

## 一、这个类是干什么的

ThreadState是DeerFlow整个智能体系统里最核心的状态容器。

这个类定义在一次对话线程里所有需要被记住的东西。

LangGraph图在运行时每走一步都会产生状态。
ThreadState就是这些状态的完整蓝图。

这个类解决的问题很明确。
一次智能体运行不只是有聊天消息。
一次运行还有沙箱、任务清单、目标、子任务委派记录、技能上下文、工具产物等等。
这些东西都需要一个统一的地方存放。
ThreadState就是这个统一的地方。

这个类在什么场景被使用。

所有智能体图在构建时都用ThreadState做状态模式。
所有中间件读写状态时都通过ThreadState里的字段。
所有检查点保存时都按ThreadState的结构序列化。

这个类继承自LangChain的AgentState。
AgentState提供了messages这个基础字段。
ThreadState在此基础上扩展了大量业务字段。

这个类的模块说明指出了它的定位。
扩展AgentState。
增加sandbox、thread_data、title、artifacts、todos、uploaded_files、viewed_images、goal、promoted、delegations、skill_context、summary_text等字段。
使用一批自定义reducer来控制每个字段的合并规则。

这个类的重要特点是它不只是字段定义。
每个关键字段都绑定了自己的reducer函数。
reducer决定了多个节点同时写同一个字段时怎么合并。
没有reducer的字段使用默认的LastValue语义。
也就是最后一次写入直接覆盖。

## 二、类的成员（字段、方法，各自做什么）

### （一）字段：沙箱与线程数据

- sandbox：沙箱状态。类型是SandboxStateField。绑定merge_sandbox这个reducer。这个reducer只接受幂等写入。同一个线程里出现不同沙箱id会直接抛错。这样设计是为了暴露沙箱生命周期隔离bug。
- thread_data：线程数据目录信息。类型是ThreadDataState的可选值。记录工作区路径、上传路径、输出路径。
- uploaded_files：已上传文件列表。类型是字典列表。这个字段没有自定义reducer。

### （二）字段：对话控制类

- title：线程标题。类型是可选字符串。自动标题中间件会写这个字段。
- todos：任务清单。类型是可选列表。绑定merge_todos这个reducer。新值是None就保留旧值。新值哪怕是空列表也算显式更新并生效。
- goal：目标状态。类型是GoalState的可选值。绑定merge_goal这个reducer。节点没碰goal就保留已有的活跃目标。这个类来自deerflow.agents.goal_state模块。

### （三）字段：产物与图片

- artifacts：产物路径列表。类型是字符串列表。绑定merge_artifacts这个reducer。合并时会去重并保留出现顺序。
- viewed_images：已查看图片的元数据字典。键是图片路径。值是ViewedImageData。绑定merge_viewed_images这个reducer。新值是空字典时清空所有记录。这个设计让中间件处理后能主动清空状态。
- tool_artifacts：工具产物注册表。类型是ArtifactEntry列表。绑定merge_tool_artifacts这个reducer。按handle去重。支持trim_to滑动窗口裁剪指令。有1000条的绝对上限。
- tool_artifact_processed：已被处理过的工具产物handle列表。绑定merge_artifacts去重合并。

### （四）字段：委派与技能

- delegations：子任务委派台账。类型是DelegationEntry列表。绑定merge_delegations这个reducer。相同（run_id、消息id）保留最新版本。终态状态永远不被非终态覆盖。台账最多保留50条。
- skill_context：技能上下文。类型是SkillEntry列表。绑定merge_skill_context这个reducer。按path去重。保留最近读取的8条。条目只存引用不存SKILL.md正文。
- promoted：延迟工具提升记录。类型是PromotedTools的可选值。绑定merge_promoted这个reducer。按目录哈希分组。目录哈希变了就整体替换防止陈旧名字暴露。
- background_tasks：后台任务状态列表。类型是BackgroundTaskState列表。没有自定义reducer。

### （五）字段：压缩与摘要

- task_notes：任务笔记。类型是可选字典。绑定TaskNotesChannel。这个通道来自deerflow.agents.task_continuity.state模块。合并函数是merge_task_notes。
- task_history：任务历史。类型是可选字典。没有自定义reducer。
- summary_text：摘要文本。类型是可选字符串。这是LastValue通道。摘要中间件更新这个字段。
摘要文本作为持久上下文数据投影进模型请求。
摘要文本不是作为messages条目存放的。

### （六）继承来的成员

- messages：消息列表。这个字段来自父类AgentState。
ThreadState本身没有重定义messages。
DeltaThreadState子类才用DeltaChannel重定义了messages。

## 三、它和谁协作

### （一）父类

- ThreadState继承自langchain.agents.AgentState。
AgentState提供了messages字段的基础定义。

### （二）组合的类型

ThreadState把同文件里的几乎所有小类型组合在一起。

- SandboxState通过sandbox字段组合。
- ThreadDataState通过thread_data字段组合。
- BackgroundTaskState通过background_tasks字段组合。
- ViewedImageData通过viewed_images字段组合。
- PromotedTools通过promoted字段组合。
- DelegationEntry通过delegations字段组合。
- SkillEntry通过skill_context字段组合。
- ArtifactEntry通过tool_artifacts字段组合。
- GoalState来自goal_state.py模块。通过goal字段组合。

### （三）调用的模块

- deerflow.checkpoint_patches。这是导入时的检查点补丁修复。
- deerflow.agents.goal_state。提供GoalState类型。
- deerflow.agents.task_continuity.state。提供TaskNotesChannel和merge_task_notes。
- deerflow.config.database_config。提供默认快照频率和通道模式。
- deerflow.subagents.status_contract。提供子任务状态值集合。
- langgraph.channels。提供DeltaChannel。
- langchain_core.messages。提供消息类型和转换函数。

### （四）被谁使用

- DeltaThreadState继承ThreadState。
- get_thread_state_schema函数按通道模式返回ThreadState或delta变体。
- 所有中间件和图节点通过这个类的字段读写状态。
- lead_agent工厂构建图时使用这个状态模式。

## 四、重要性评级（1-10分+理由）

评级是10分。

理由如下。

ThreadState是整个智能体运行时的数据中枢。
系统中所有图节点、所有中间件、所有检查点保存都依赖这个类。
如果删掉这个类。
DeerFlow的智能体系统会完全无法运行。
没有这个类就没有统一的状态结构。
消息、沙箱、目标、委派、技能、产物全部失去存放位置。

依赖它的地方遍布全仓库。
同文件的10个reducer函数为它服务。
DeltaThreadState继承它。
get_thread_state_schema根据它派生不同模式。
大量中间件直接引用它的字段名。

这个类的reducer设计还承载了重要的正确性保证。
比如委派台账的终态保护。
比如沙箱id的冲突检测。
比如产物列表的去重。
删掉这些语义会导致状态在并发写入时出现静默错误。

这个类是本批次17个类里最重要的一个。
评级给满10分。
