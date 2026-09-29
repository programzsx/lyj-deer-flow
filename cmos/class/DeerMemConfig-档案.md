# DeerMemConfig-档案

## 一、这个类是干什么的

DeerMemConfig是agents/memory/backends/deermem/deermem/config.py里的pydantic模型。

它是DeerMem私有配置。自包含。host无关。

DeerMem的全部旋钮在这里声明。

存储、队列、facts、注入、staleness审查、信号检测。

DeerMemModelConfig是内存更新LLM的配置。

langchain init_chat_model参数。

这个类位于backend/packages/harness/deerflow/agents/memory/backends/deermem/deermem/config.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、DeerMemModelConfig

provider是langchain model_provider。例如openai。

DeepSeek或其他OpenAI兼容gateway用openai加base_url。

model是模型名。None表示没配LLM。非LLM操作仍工作。

api_key可选。base_url可覆盖。temperature可选。

### 2、存储旋钮

storage_path是数据根。空时用DEERMEM_DATA_DIR或~/.deermem/。

per-user内存在{root}/users/{user_id}/memory.json。

storage_class是替代存储提供者的点分路径。

file是默认。markdown是容忍加载路径。

strict_user_scope要求每个存储scope有user_id。

manifest_filename是用户全局摘要JSON文件名。

file_lock_timeout_seconds是per-scope跨进程advisory文件锁的最大等待。

### 3、检索旋钮

retrieval_adapter是检索adapter工厂。

fts5默认。空字符串禁用。点分工厂实现RetrievalPort。

retrieval_relevance_enabled启用相关性感知检索。

search绕过retrieval_adapter。

包括FTS5和自定义工厂。

确定性词法相关性结合confidence排序。

相关facts没有字面子串匹配也返回。

fact_dedup_enabled启用确定性近重复门。

新fact和同scope同category已有fact的token-Jaccard相似度达到阈值时合并。

已有id、content、createdAt保留。confidence提升到max。

纠正替换和提出的移除目标排除在近去重外。

retrieval_relevance_weight是词法相关性对confidence的权重。

retrieval_diversity_weight是贪心MMR相似度惩罚。

降级近重复facts。

### 4、队列旋钮

debounce_seconds默认30。

queue_max_depth默认1000。

backpressure cap。0是无界。

达到cap时新非信号更新被拒绝。

QueueFull。

信号更新总是准入。

重要内存永不丢失。

### 5、facts旋钮

max_facts默认100。10到500。

fact_eviction_policy是confidence或hybrid-v1。

hybrid-v1结合confidence、显式确认新鲜度、query驱动的访问热度。带有界纠正槽。

fact_eviction_shadow_enabled在confidence-policy修剪时也算hybrid-v1。

分歧进metadata-only的eviction审计。

fact_confidence_threshold默认0.7。存储facts的最小置信度。

### 6、注入旋钮

max_injection_tokens默认2000。

token_counting是tiktoken或char。

tiktoken准确但首次用可能下载BPE数据。

char是无网络的CJK感知估算。

guaranteed_categories总是注入。不管常规token预算。默认correction。

guaranteed_token_budget是保证类facts的token上限。

### 7、staleness审查旋钮

staleness_review_enabled默认True。

staleness_age_days默认90。

## 三、它和谁协作

- DeerMem在model_post_init解析它。
- 五个core模块消费各旋钮。
- signals的judge钩子。

## 四、重要性评级

评级是7分。

理由如下。

这个配置是DeerMem全部行为的声明。

去重、相关性、淘汰、注入预算、staleness都有旋钮。

信号更新永不被backpressure丢弃。

保证类别token预算。

token计数可选tiktoken或char。

shadow淘汰审计。

这些是内存质量的旋钮层。

扣掉3分。

扣分原因是它是配置声明。逻辑在core。
