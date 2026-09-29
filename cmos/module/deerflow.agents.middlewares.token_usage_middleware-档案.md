# deerflow.agents.middlewares.token_usage_middleware档案

源码路径是backend/packages/harness/deerflow/agents/middlewares/token_usage_middleware.py。

## 一、这个中间件是干什么的

这个中间件做两件事。

第一件事是记录token用量日志。

每次模型响应都带usage_metadata。

这个中间件把用量写进日志。

日志里有输入token、输出token、总token。

日志里还有输入输出的token明细。

第二件事是给AI步骤打归因标。

前端要展示每一步做了什么。

这一步是调用工具还是派发子智能体。

这一步是最终回答还是思考。

这个中间件把这些信息写进消息的additional_kwargs。

前端从归因标读步骤信息。

这个中间件还把子智能体的token用量回填到派发消息。

回填让token_budget_middleware能捕获子智能体的消耗。

## 二、模块里的主要成员

### 1、TokenUsageMiddleware类

TokenUsageMiddleware是这个中间件的核心类。

这个类继承AgentMiddleware。

核心方法是_apply。

after_model和aafter_model都调用_apply。

配置开关是token_usage.enabled。

开关判断在装配层完成。

### 2、子智能体用量回填

_apply先做子智能体用量回填。

子智能体的终止用量随当前run的ToolMessage传输。

用量放在ToolMessage的additional_kwargs里。

键是SUBAGENT_TOKEN_USAGE_KEY。

回填逻辑分五步。

第一步从消息列表的倒数第二个位置向前走。

只走连续的ToolMessage。

这样多个并发的task调用都能回填到同一条派发消息。

第二步读每个ToolMessage的子智能体用量。

_subagent_usage_from_tool_message辅助函数做读取。

读取前检查SUBAGENT_TOKEN_USAGE_ATTRIBUTED_KEY。

已经标记为True的ToolMessage跳过。

这个标记防止检查点回放或中间件重入时重复累加。

用量还经过normalize_token_usage验证。

第三步向前找派发这条调用的AIMessage。

_has_tool_call辅助函数判断AIMessage是否包含指定id的调用。

一次模型响应可能派发多个task调用。

所以不能假设固定偏移。

第四步合并用量。

多个task调用合并进同一次状态更新。

usage_metadata的三个字段累加。

第五步生成状态更新。

AIMessage的副本带合并后的usage_metadata。

ToolMessage的副本带attributed标记。

同一状态更新完成两个写入。

这样检查点回放不会重复累加。

### 3、用量日志

_apply再做用量日志。

最后一条消息是AIMessage时读usage_metadata。

日志用logger.info输出。

日志带input_token_details和output_token_details明细。

明细为空时省略后缀。

### 4、归因标生成

归因标的核心是_build_attribution函数。

这个函数为最后一条AIMessage生成归因字典。

归因字典有五个键。

version固定为1。

version让schema变更保持向后兼容。

旧前端忽略未知字段安全回退。

kind是这步的整体类型。

shared_attribution表示这步是否包含多个动作。

tool_call_ids列出全部工具调用id。

actions列出每个动作的明细。

_infer_step_kind函数推断步骤类型。

有todo类动作且只有一个时返回todo_update。

只有一个subagent动作时返回subagent_dispatch。

有其他动作时返回tool_batch。

没有动作但有文本时返回final_answer。

没有动作也没有文本时返回thinking。

### 5、动作明细生成

_describe_tool_call函数把一个工具调用变成动作明细。

write_todos调用展开成todo动作。

task调用变成subagent动作。

动作带description和subagent_type。

web_search和image_search调用变成search动作。

动作带query。

present_files调用变成present_files动作。

ask_clarification调用变成clarification动作。

其他调用变成通用tool动作。

### 6、todo动作对比

_build_todo_actions函数对比新旧todo列表。

这个函数是write_todos精确归因的唯一来源。

对比逻辑分四步。

第一步按content建立旧todo索引。

同一个content可能对应多个旧todo。

第二步逐条匹配新todo。

优先按content匹配。

已匹配的旧todo不再重复匹配。

第三步内容不同时按位置兜底匹配。

位置兜底有前提。

前提是新条目不在旧索引里。

前提是位置上还没有匹配。

第四步收集未匹配的旧todo为todo_remove动作。

_todo_action_kind函数判断动作类型。

旧条目不存在时status是completed就是todo_complete。

旧条目不存在时status是in_progress就是todo_start。

其他情况是todo_update。

内容变了就是todo_update。

内容相同status是completed就是todo_complete。

内容相同status是in_progress就是todo_start。

_normalize_todos函数规范化todo条目。

非字典条目跳过。

content必须是字符串。

status只接受pending、in_progress、completed三个值。

前端在归因标缺失或畸形时回退到通用的"Update to-do list"标签。

## 三、它和谁协作

这个中间件在lead-only中间件组里。

装配顺序排第23位。

这个中间件是可选的。

配置开关是token_usage.enabled。

这个中间件和token_budget_middleware协作。

子智能体用量回填到消息历史后token_budget靠差值捕获。

这个中间件依赖deerflow.subagents.status_contract。

status_contract提供用量键和normalize_token_usage。

这个中间件的归因标被前端消费。

前端据此渲染步骤标签。

## 重要性评级

评级是6分。

理由如下。

token用量日志是成本观测的基础。

子智能体用量回填是预算控制的支撑。

没有回填lead侧的预算会漏算子智能体消耗。

归因标是前端步骤展示的数据来源。

没有归因标前端只能显示通用标签。

不评8分以上的原因是这个中间件不影响对话正确性。

这个中间件是可选功能。

归因标缺失时前端有安全回退。

所以评级是6分。
