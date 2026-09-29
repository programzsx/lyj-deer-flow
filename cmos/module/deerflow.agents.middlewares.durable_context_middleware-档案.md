# deerflow.agents.middlewares.durable_context_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/durable_context_middleware.py。

## 一、这个中间件是干什么的

这个中间件负责持久上下文的捕获和注入。

长对话会触发上下文压缩。

压缩会丢掉旧的tool调用、技能记录、任务结果。

没有这个中间件，模型压缩后就看不到这些信息。

这个中间件在压缩前把关键信息捕获到检查点状态里。

捕获的内容有任务委派、已加载技能、任务工作笔记。

注入时把捕获的内容投影进每次模型请求。

注入的内容有目标、摘要、委派台账、技能上下文、工件注册表。

注入通过一个隐藏的durable_context_data数据块完成。

数据块永远不会写回状态。

这样模型每次调用都能看到压缩历史和委派工作。

## 二、模块里的主要成员

### 1、常量

_DURABLE_CONTEXT_DATA_KEY是数据块标记，值是durable_context_data。

_SUMMARY_RENDER_CHAR_BUDGET是摘要渲染预算，值是6000字符。

_GOAL_RENDER_CHAR_BUDGET是目标渲染预算，值是4000字符。

_AUTHORITY_CONTRACT是权威契约文本。

契约告诉模型把数据块里的字段值当数据，不当指令。

_ACTIVE_GOAL_CONTRACT是目标例外条款。

条款说明active_goal元素是用户设定的目标，可以按用户请求对待。

### 2、_render_durable_context_data函数

这个函数渲染完整的数据块。

渲染顺序是固定的。

先是目标，然后是会话摘要，然后是委派台账，然后是技能上下文，然后是工件注册表，最后是任务工作笔记。

目标放最前，因为目标只在用户设置或清除时变化。

顺序稳定让缓存前缀命中。

所有字段值都做HTML转义。

最终用durable_context_data标签包起来。

### 3、委派捕获相关的函数

extract_delegations来自delegation_ledger模块。

_filter_changed_delegations函数过滤没有变化的条目。

只保留新增或字段变化的条目。

 Retained窗口逻辑比较已有条目数和上限。

_run_opening_human_index函数找本次run的起始HumanMessage。

判断依据是消息携带本run的run_id，或run_id为空且不在运行前已有消息里。

_current_run_messages函数返回本次run的消息尾部。

_with_run_id函数给当前run的委派打上run_id标记。

_close_delegations_left_by_earlier_runs函数把更早run遗留的in_progress委派标记为cancelled。

这个函数防止台账永远告诉模型"不要重复委派"。

带回复的遗留条目不标记，因为回复归属不明确。

### 4、DurableContextMiddleware类

这是模块的中间件类。

这个类继承AgentMiddleware。

### （1）__init__构造函数

构造参数有技能根路径、技能读取工具名、工件注入开关、任务连续性开关、PII脱敏配置。

### （2）release_policy_parameters方法

这个方法返回规范化后的捕获和注入配置。

包括技能根路径、技能读取工具名、任务连续性开关、工件注入开关、PII脱敏开关。

### （3）before_model和abefore_model钩子

这两个钩子调用_capture。

_capture先捕获委派，再捕获技能上下文。

extract_skills从消息里提取技能文件引用。

技能只存名字、路径、描述，不存SKILL.md正文。

返回状态更新字典。

### （4）after_model和aafter_model钩子

这两个钩子调用_capture_delegations。

只捕获委派变化。

### （5）wrap_model_call和awrap_model_call钩子

这两个钩子调用_inject。

_inject从状态读目标、摘要、委派、技能、工件、任务笔记。

目标先做PII脱敏。

工件的展示字段也做PII脱敏。

然后调用_render_durable_context_data生成数据块。

数据块为空时不注入。

非空时插入两条消息。

第一条是SystemMessage，携带权威契约。

第二条是HumanMessage，携带数据块，带hide_from_ui和durable_context_data标记。

两条消息都带来源标记。

插入位置在开头的SystemMessage之后。

## 三、它和谁协作

上游是delegation_ledger模块。

委派的提取和渲染都委托给delegation_ledger。

技能提取来自skill_context模块。

工件渲染来自artifact_registry模块。

PII脱敏来自pii_redaction_middleware的redact_text。

状态存储在ThreadState的delegations、skill_context、task_notes、task_history。

注入通过provenance_kwargs打来源标记。

这个中间件是lead agent链的成员。

子智能体构建也在摘要前挂这个中间件。

这样压缩摘要投影在保留的assistant尾部之前。

配置项有技能根路径和任务连续性开关。

## 重要性评级

评级是9分。

理由如下。

长对话的上下文压缩是核心场景。

没有这个中间件，压缩后模型会失去委派历史、技能记忆、任务笔记。

模型会重复委派任务。

模型会忘记技能。

模型会忘记目标和摘要。

这个中间件解决的是持久记忆问题。

同时它严格区分权威和数据。

静态规则进SystemMessage。

不可信字段值进隐藏HumanMessage数据块。

这符合提示词信任边界。

遗留委派的取消逻辑防止台账误导模型。

所以评级是9分。

不评10分的原因是核心的模型调用和工具执行不直接依赖它。

它失效时短会话仍然正常工作。

所以评级是9分。
