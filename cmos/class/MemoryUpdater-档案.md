# MemoryUpdater-档案

## 一、这个类是干什么的

MemoryUpdater是agents/memory/backends/deermem/deermem/core/updater.py里的类。

它用LLM基于会话上下文更新内存。

它是DeerMem的提取引擎。

DI注入config、storage、llm、prompts_dir、callbacks。

它处理staleness审查、整合、水位、容量淘汰、scope gate。

这个类非常大。约2600行。

这个类位于backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/core/updater.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造和水位

构造方法注入config、storage、llm。

prompts_dir可选。callbacks可选。

on_memory_llm_call在LLM调用前合并trace元数据。

_watermarks是每(thread_id, user_id, agent_name)的已提取消息身份。

有界LRU。config.watermark_max_keys。

长寿命gateway处理很多线程不能无限增长。

丢键时该线程下轮重新提取一批。

### 2、存储访问

_save_memory_to_file通过注入的storage保存。

expected_revision支持乐观并发。

get_memory_data和reload_memory_data通过storage。

### 3、容量淘汰

_select_for_capacity应用配置策略。

可选计算hybrid shadow。

fact_eviction_policy是hybrid-v1或shadow启用时算usage。

decision和shadow_decision。

_record_capacity_decision在规范持久化成功后尽力写审计。

### 4、import_memory_data方法

替换导入不能把畸形facts变成删除。

在宽容兼容规整或任何storage读之前验证。

facts必须是列表。content非空。

apply_changes带upserts、deletes、revisions。

manifest revision乐观并发。

容量淘汰应用。

### 5、staleness审查

_select_stale_candidates返回超过个体审查窗口的facts。

每个fact的有效审查age由expected_valid_days决定。

没有时回退全局staleness_age_days。

有效的lastConfirmedAt重置审查时钟。

它是fact仍真的显式证据。

否则createdAt是参考。

保护类别排除。默认correction。

它们是显式用户反馈。不应按age自动修剪。

_safe_add_days处理巨大持久值的溢出。

返回None让调用方回退。

不中止整个更新周期。

staleness_max_lifetime_multiplier cap在写时应用一次。

审查窗口从一开始有界。

在这里再应用会阻止寿命延长操作移动审查窗口。

 defeating staleFactsToExtend的目的。

### 6、staleness prompt

_build_staleness_section从候选facts格式化prompt节。

每个fact行带valid:Nd标注。

该fact的有效审查窗口。

LLM能校准它的保守性。

30天后审查的fact在创建时被认为易变。

365天后审查的被认为稳定。

### 7、scope gate

_fact_scope_gate_reason、_summary_scope_gate_reason、_removal_scope_gate_reason。

规范化gate标签。

scope gate防止LLM越权。

### 8、响应解析

_parse_memory_update_response解析LLM响应。

_normalize_memory_update_data规整更新数据。

_strip_upload_mentions从内存剥离上传提及。

### 9、去重

_fact_content_key规整内容键。

_fact_content_tokens分词。

_fact_content_similarity计算token-Jaccard相似度。

## 三、它和谁协作

- MemoryStorage是存储层。
- DeerMemConfig提供配置。
- MemoryUpdateQueue调用update_memory。
- load_prompt加载prompt模板。
- callbacks注入tracing。

## 四、重要性评级

评级是8分。

理由如下。

MemoryUpdater是内存提取的大脑。

LLM响应解析、scope gate、水位、staleness、整合、容量淘汰都在这里。

巨大数值的溢出处理很细。

_safe_add_days防OverflowError中止整个更新周期。

保护类别不按age修剪。

staleness prompt的valid:Nd标注帮LLM校准。

乐观并发贯穿。

这些是内存质量的核心。

扣掉2分。

扣分原因是它依赖LLM质量。
