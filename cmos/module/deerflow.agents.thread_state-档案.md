# deerflow.agents.thread_state-档案

## 一、这个模块是干什么的

这个文件定义了DeerFlow的线程状态schema。

线程状态是LangGraph图的共享状态。

每个checkpoint都持久化这个状态。

这个文件定义了ThreadState类型。

ThreadState在LangChain的AgentState之上扩展了很多字段。

这个文件还给每个共享字段定义了reducer。

reducer决定多次写入怎么合并。

这个文件还定义了delta模式的消息字段。

## 二、模块里的主要成员

### 1、ThreadState类型

ThreadState继承自AgentState。

扩展的字段有这些。

sandbox是沙箱状态。

thread_data是线程数据路径。

title是线程标题。

artifacts是产物列表。

todos是计划任务列表。

goal是线程目标。

uploaded_files是上传文件。

viewed_images是已查看图片。

promoted是延迟工具晋升。

delegations是任务委派台账。

skill_context是技能上下文。

tool_artifacts是工具产物注册表。

task_notes和task_history是任务连续性字段。

summary_text是摘要文本。

background_tasks是后台任务状态。

### 2、reducer函数族

每个共享字段都有自己的reducer。

#### （1）merge_sandbox

这个reducer只接受幂等写入。

多个沙箱工具会在同一图步骤里懒初始化。

它们会发出同一个sandbox_id。

同一个线程里出现不同沙箱id说明有隔离bug。

reducer直接抛错，不悄悄选一个。

#### （2）merge_artifacts

这个reducer合并产物列表并去重。

去重时保持顺序。

#### （3）merge_viewed_images

这个reducer合并图片字典。

空字典表示清空全部。

这让中间件能在处理后清掉状态。

#### （4）merge_todos和merge_goal

这两个reducer保留最后的非None值。

节点不碰这些字段时保留现有值。

#### （5）merge_promoted

这个reducer管理延迟工具的晋升。

按catalog_hash分域。

catalog变了就整体替换，丢弃旧名字。

catalog没变就合并名字并去重。

#### （6）merge_delegations

这个reducer管理委派台账。

按run_id加id去重。

同一键的最新版本胜出。

终态状态永远不被非终态覆盖。

台账最多保留50条。

#### （7）merge_skill_context

这个reducer管理技能上下文。

按path去重。

后来的读取刷新新近度。

历史条目被规范化为引用。

SKILL.md正文不进状态。

最多保留8条。

#### （8）merge_tool_artifacts

这个reducer管理工具产物注册表。

按handle去重。

支持trim_to指令做滑动窗口。

绝对上限是1000条。

### 3、delta消息机制

merge_message_writes按add_messages语义线性折叠写入。

它保持公开reducer的全部行为。

包括重复id、替换位置、删除错误、REMOVE_ALL_MESSAGES。

delta_messages_field在指定快照频率上构造DeltaChannel。

DeltaThreadState在delta模式下用DeltaChannel替换messages字段。

get_thread_state_schema按模式返回schema。

full模式返回ThreadState。

delta模式返回DeltaThreadState。

adapt_state_schema_for_mode把自定义schema适配到delta模式。

normalize_middleware_state_schemas把中间件自己的state_schema适配到delta模式。

## 三、它和谁协作

它依赖langchain的AgentState和langgraph的通道。

它依赖deerflow.agents.goal_state的GoalState。

它依赖deerflow.checkpoint_patches的导入时修复。

它依赖deerflow.subagents.status_contract的状态值。

它被工厂、客户端、中间件、工具引用。

所有图构建方都用这个schema。

## 四、重要性评级

评级是9分。

理由是这个文件定义了整个图的共享状态。

所有中间件和工具都通过这个状态交换信息。

reducer语义决定了并发写入的正确性。

delta模式的消息折叠是复杂且关键的行为。

不评10分的原因是它自己不执行业务逻辑。

它的价值通过其他模块的读写体现。
