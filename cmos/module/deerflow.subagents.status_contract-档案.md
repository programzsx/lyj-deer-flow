# deerflow.subagents.status_contract-档案

## 一、这个模块是干什么的

这个模块定义后端和前端之间结构化子代理结果元数据的契约。

task工具的结果文本是模型可见的显示内容。运行时消费者读的是ToolMessage.additional_kwargs里携带的结构化事实。

这个模块定义这些键的名字、取值范围、读写函数。跨语言契约由contracts/subagent_status_contract.json固定。Python和TypeScript的契约测试互相对齐。

## 二、模块里的主要成员

### 1、键名常量

模块定义十个additional_kwargs键。

- subagent_status。状态。取值见下面。
- subagent_stop_reason。可选。守卫上限提前结束的原因。
- subagent_error。可选。人类可读的错误。
- subagent_result_brief。可选。有界完成结果元数据。
- subagent_result_sha256。可选。完整结果的摘要。
- subagent_model_name。可选。这次委派使用的有效DeerFlow模型标识。
- subagent_token_usage。可选。最终累计token快照。
- subagent_tool_receipts。可选。子代理的收据。
- subagent_receipt_verdict。可选。父侧引用检查结论。
- subagent_acceptance_verdict。可选。确定性验收清单结论。

### 2、状态值词汇

SUBAGENT_STATUS_VALUES是五个值。completed、failed、cancelled、timed_out、polling_timed_out。

被上限截断的运行不获得自己的状态值。产出可用输出的截断运行是completed。没有输出的截断运行是failed。原因放在附加的stop_reason字段。旧前端忽略未知字段。向后兼容。

SUBAGENT_STOP_REASON_VALUES是三个值。token_capped、turn_capped、loop_capped。

_LEGACY_STATUS_NORMALIZATION处理遗留状态值。max_turns_reached是第一阶段发出的状态。第二阶段移除了。但持久化的历史里还有。读取时把max_turns_reached映射成turn_capped。历史数据能终态解析。不会卡在in_progress。

### 3、make_subagent_additional_kwargs函数

这个函数构建中间件盖章的additional_kwargs载荷。

状态不在词汇表里抛ValueError。stop_reason不在词汇表里也抛ValueError。不接受任意字符串。打错字会静默漏给消费者。在生产者边界大声失败。

completed状态且有结果时。载荷带result_brief和result_sha256。result_brief有界。sha256是完整结果的摘要。

非completed状态且有错误时。载荷带error。空错误不携带。避免误导性的空subagent_error。

stop_reason在守卫上限结束时才盖章。

model_name、token_usage、tool_receipts、receipt_verdict、acceptance_verdict依次验证后加入。

### 4、normalize_token_usage函数

这个函数把累计token映射验证成契约形状。

这是两个表面的单一共享验证器。终态ToolMessage元数据在这里。持久化的subagent.step和subagent.end运行事件在step_events.py。一个函数防止两个表面漂移。

要求input_tokens、output_tokens、total_tokens三个键都是非负整数。bool被拒绝。映射格式不对返回None。

### 5、format_subagent_result_message函数

这个函数返回模型可见的任务文本加规范化元数据错误。

stop_reason设置了。文本里折进一个(capped: ...)注记。主代理不用解析元数据就知道运行被上限截断。

completed折叠"Task Succeeded (capped: token budget). Result: ..."。cancelled折叠取消详情。timed_out折叠超时详情。failed折叠错误详情。

### 6、read_subagent_result_metadata函数

这是读取侧。

additional_kwargs为空返回None。

先处理遗留状态。max_turns_reached映射成turn_capped。带result_brief的映射成completed加turn_capped。不带result的映射成failed加turn_capped。

正常状态直接使用。不认识的返回None。

结构化结果包含status。可选stop_reason、result_brief、result_sha256、error、tool_receipts、receipt_verdict、acceptance_verdict。

### 7、_bound_metadata_text函数

这个函数限制元数据文本长度。上限2000字符。

超长文本用头加省略号加尾的格式。头占三分之二。尾占剩余。

## 三、它和谁协作

task_tool用make_subagent_additional_kwargs构建元数据。用format_subagent_result_message渲染模型可见文本。

worker和前端用read_subagent_result_metadata读取结构化事实。

contracts/subagent_status_contract.json固定词汇表。test_status_values_match_contract和test_stop_reason_values_match_contract互相对齐。

它依赖receipt_verification和acceptance_checks的验证函数。

## 四、重要性评级

评级是7分（满分10分）。

理由：

status_contract是后端和前端之间子代理状态的唯一契约。没有它。前后端对状态值的理解会漂移。

stop_reason的附加字段设计是向后兼容的。旧前端忽略未知字段。旧状态值的读取侧规范化让历史数据能终态解析。

生产者边界的严格验证防止打错字静默漏过。空错误不携带。sha256格式读取侧校验。

它影响前端卡片、持久化事件、API响应。给7分。
