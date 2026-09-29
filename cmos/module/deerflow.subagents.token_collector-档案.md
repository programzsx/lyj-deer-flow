# deerflow.subagents.token_collector-档案

## 一、这个模块是干什么的

这个模块收集子代理内部LLM调用的token用量。

子代理执行过程中会产生多次LLM调用。每次调用消耗token。这些token要记账到父线程的RunJournal里。

每个子代理执行创建一个自己的collector。collector是一个LangChain回调处理器。每次LLM响应结束。collector记一条用量记录。子代理结束后。记录通过RunJournal的record_external_llm_usage_records转交给父日志。

## 二、模块里的主要成员

模块只有一个类。

### 1、SubagentTokenCollector类

这个类继承BaseCallbackHandler。它是轻量级的回调处理器。

构造时接收一个caller参数。caller是调用者标识。格式是"subagent:<子代理名>"。

内部状态有两样。_records是用量记录列表。_counted_run_ids是已记账的run_id集合。

on_llm_end方法在每次LLM响应结束时被LangChain调用。

方法先检查run_id是否已经记账。重复的run_id直接返回。这防止一次响应被记两次。

然后遍历响应的generations。找带message的generation。从message的usage_metadata里取用量。

取三个数。input_tokens。output_tokens。total_tokens。total_tokens取不到就用输入加输出算。还是取不到就跳过这条记录。

token缓存命中也要记账。从input_token_details里取cache_read。缓存命中是缓存感知成本核算需要的。缓存命中数为0或解析失败就省略这个键。键是稀疏的。和日志的按模型桶保持一致。只在供应商真的报了缓存命中时才出现。

模型名也要捕获。从response_metadata里取model_name或model。捕获实际产出响应的模型。父日志按真实模型分桶。而不是按主代理解析的模型。因为"inherit"模型下子代理实际用的模型可能和主代理不同。

一条记录包含七个字段。source_run_id。caller。model_name。input_tokens。output_tokens。total_tokens。可选的cache_read_tokens。

snapshot_records方法返回积累记录的副本。executor在每个流块边界调用它。把最新快照发布到共享的SubagentResult上。

## 三、它和谁协作

executor在每次执行时创建collector。collector被放进run_config的callbacks。LangChain的回调机制调用它的on_llm_end。

executor的流循环在每个values块边界调用snapshot_records。发布到SubagentResult的token_usage_records。

父侧的RunJournal通过record_external_llm_usage_records接收记录。记录按模型分桶。

status_contract的normalize_token_usage校验记录形状。

## 四、重要性评级

评级是5分（满分10分）。

理由：

token记账是成本核算和配额控制的基础。子代理的token消耗必须归到父线程。没有这个collector。子代理的用量就丢了。

run_id去重防止了双记。缓存命中稀疏键的设计和日志分桶一致。捕获真实模型名让按模型核算准确。

但这个模块很小。只有83行。逻辑单一。它只是一个记账处理器。坏了影响的是用量数字的准确性。不影响功能。

给5分。
