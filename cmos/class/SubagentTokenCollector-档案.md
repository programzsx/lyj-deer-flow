# SubagentTokenCollector档案

源码位置：backend/packages/harness/deerflow/subagents/token_collector.py

## 一、这个类是干什么的

SubagentTokenCollector是子Agent的token用量收集器。

SubagentTokenCollector是一个回调handler。每个子Agent执行创建自己的收集器。收集器在子Agent运行期间收集LLM token用量。

子Agent结束后。收集到的记录转移到父RunJournal。转移用RunJournal.record_external_llm_usage_records方法。

SubagentTokenCollector的工作方式是这样的。

每次LLM响应结束触发on_llm_end。on_llm_end按run_id去重。同一个run_id只记一次。

on_llm_end从响应里提取用量。输入token、输出token、总token。总token缺失时用输入加输出算。总token为零就跳过。

prompt缓存命中也会记录。缓存命中的token单独记。缓存命中用于缓存感知的成本核算。

模型名也记录。记录的是真正产生响应的模型。不是lead agent解析的模型。这样父的账本能按真实模型分桶。

## 二、类的成员

（一）字段

- caller：调用者标识。
- _records：用量记录列表。
- _counted_run_ids：已计数的run_id集合。去重用。

（二）方法

- on_llm_end：LLM响应结束的回调。提取用量。按run_id去重。
- snapshot_records：返回累积记录的副本。

## 三、它和谁协作

（一）使用者

SubagentExecutor为每次子Agent执行创建收集器。收集器挂进LangChain回调。

（二）父账本

子Agent结束后记录转移到父RunJournal。转移用record_external_llm_usage_records。

（三）下游事件

task_running事件携带快照。工作区卡片可以更新。不用重新核算父运行的总数。

## 四、重要性评级

评级：6分。

理由：SubagentTokenCollector是子Agent token核算的采集端。它的run_id去重防止重复计数。缓存命中和真实模型名的记录让成本核算准确。没有它，子Agent的token用量就没人管。给6分。
