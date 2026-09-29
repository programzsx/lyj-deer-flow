# StructuredSubagentResult档案

源码位置：backend/packages/harness/deerflow/subagents/status_contract.py

## 一、这个类是干什么的

StructuredSubagentResult是结构化子Agent结果元数据的类型声明。

StructuredSubagentResult是TypedDict。StructuredSubagentResult描述ToolMessage.additional_kwargs里携带的结构化事实。

StructuredSubagentResult的字段有这些。subagent_status是状态。subagent_stop_reason是护栏上限原因。subagent_error是错误。subagent_result_brief和subagent_result_sha256是有界的结果元数据和摘要。subagent_model_name是实际用的模型。subagent_token_usage是最终的token用量。subagent_tool_receipts是工具收据。subagent_receipt_verdict是引用检查结论。subagent_acceptance_verdict是验收检查结论。

status_contract.py还定义了两套词汇。SUBAGENT_STATUS_VALUES是状态词汇。SUBAGENT_STOP_REASON_VALUES是上限原因词汇。词汇和contracts/subagent_status_contract.json共享。契约测试把Python和TypeScript的值钉在一起。

stop_reason是附加式设计。被上限的运行不再有自己的状态值。产出输出的上限运行是completed。没产出的是failed。原因带在附加字段上。旧前端忽略未知字段。这保持了向后兼容。

## 二、类的成员

（一）词汇常量

- SUBAGENT_STATUS_VALUES：completed、failed、cancelled、timed_out、polling_timed_out五个。
- SUBAGENT_STOP_REASON_VALUES：token_capped、turn_capped、loop_capped三个。

## 三、它和谁协作

（一）产生者

task工具的结果命令写这些元数据键。gateway会剥掉调用方伪造的结论。

（二）消费者

前端消费这些键。工作区卡片靠它们更新。契约测试钉住两边的值。

## 四、重要性评级

评级：5分。

理由：StructuredSubagentResult是跨语言契约的类型定义。stop_reason的附加式设计保持了向后兼容。read侧的规范化处理了历史遗留状态值。它是类型声明加词汇常量。给5分。
