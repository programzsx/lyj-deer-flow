# KnowledgeScope-档案

## 一、这个类是干什么的

KnowledgeScope是knowledge_scope.py里的pydantic模型。

它是一个用户turn的消息快照契约。

它承载版本化的per-message知识检索作用域。

mode是all、selected、disabled之一。

selected时带dataset_ids、document_filters、display。

这个文档覆盖KnowledgeScope加KnowledgeDocumentFilter、KnowledgeScopeDisplay、KnowledgeDisplayDataset、KnowledgeDisplayDocument、_StrictModel。

位于backend/packages/harness/deerflow/knowledge_scope.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、常量

KNOWLEDGE_SCOPE_KEY是knowledge_scope。additional_kwargs里的快照key。

KNOWLEDGE_SCOPE_RUNTIME_KEY是__knowledge_scope_execution。运行时key。

KNOWLEDGE_SCOPE_VERSION是1。

MAX_KNOWLEDGE_SCOPE_BYTES是64KiB。

MAX_DATASET_IDS是100。MAX_DOCUMENT_IDS是1000。

MAX_DISPLAY_DATASETS是20。MAX_DISPLAY_DOCUMENTS是50。

MAX_ID_CODEPOINTS是256。MAX_DISPLAY_NAME_CODEPOINTS是256。

### 2、_StrictModel

它继承BaseModel。extra=forbid。

未知字段被拒绝。不是被丢弃。

### 3、KnowledgeScope字段

version必须是字面量1。

mode必须是all、selected、disabled之一。

dataset_ids最多100条。可None。

document_filters最多100条。可None。

display可None。

### 4、_validate_and_normalize验证器

all和disabled模式不允许带selection或display。

selected模式要求至少一个dataset ID。

filter_ids不能重复。每个dataset最多一个filter。

filter必须属于selected的dataset。

总document ID数最多1000。

display的dataset ID不能重复。必须属于selected的dataset。

display的document必须有对应的document filter。且属于那个filter。

display文档总数最多50。

最后_validate_size。

### 5、_canonical_dict方法

返回稳定的JSON安全表示。

selected模式才带dataset_ids、document_filters、display。

### 6、_validate_size方法

canonical dict序列化为UTF-8 JSON。sort_keys、ensure_ascii=False、compact分隔符。

超过64KiB抛ValueError。

### 7、KnowledgeDocumentFilter

dataset_id加document_ids。

document_ids最少1条最多1000条。

dataset_id和document_ids都经过_clean_id和_stable_unique_ids。

### 8、KnowledgeScopeDisplay加display模型

datasets最多20条。

KnowledgeDisplayDataset带id、name、documents。

name必须非空。最多256码点。

display document ID不能重复。这是dataset级的。

KnowledgeDisplayDocument带id、name。

### 9、canonicalize_knowledge_scope函数

它验证并返回稳定的JSON安全消息表示。

输入已是KnowledgeScope时直接用。否则model_validate。

### 10、execution_scope函数

它只返回执行字段。排除不受信任的display块。

display是历史UI渲染用的。运行时消费者必须用execution_scope。

display约束检索的字段只在canonical里。pop掉display后剩下的是执行字段。

### 11、strip_message_knowledge_scope函数

它复制LangChain message。去掉knowledge scope快照。

additional_kwargs里有KNOWLEDGE_SCOPE_KEY或RUNTIME_KEY时才复制。

两个key都pop掉。

## 三、它和谁协作

- 消息快照在additional_kwargs里携带它。
- RAGFlow检索工具用execution_scope约束检索。
- Gateway的knowledge路由验证scope。
- edit-replay和clarification可能用验证过的客户端快照替换scope。

## 四、重要性评级

评级是7分。

理由如下。

这个模块是per-message知识作用域的契约核心。

extra=forbid拒绝未知字段。

模式互斥。all和disabled不允许selection。

display块和执行字段分开。运行时消费者用execution_scope。

display document必须属于filter。防止display声称未授权的文档。

64KiB大小上限。ID去重稳定。

这些是知识检索授权边界的关键。

扣掉3分。

扣分原因是它是验证契约类。自身无IO逻辑。
