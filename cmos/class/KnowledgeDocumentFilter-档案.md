# KnowledgeDocumentFilter-档案

## 一、这个类是干什么的

KnowledgeDocumentFilter是knowledge_scope.py里的pydantic模型。

它继承_StrictModel。extra=forbid。

它表示一个dataset的文档过滤。

字段是dataset_id加document_ids。

这个类位于backend/packages/harness/deerflow/knowledge_scope.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

dataset_id是dataset ID。字符串。

document_ids是文档ID列表。最少1条最多1000条。

### 2、_normalize验证器

dataset_id经过_clean_id。strip加长度检查。1到256码点。

document_ids经过_stable_unique_ids。去重保持输入顺序。

### 3、_clean_id

非字符串抛ValueError。

空白或超过256码点抛ValueError。

### 4、_stable_unique_ids

规范化列表保持首次出现的顺序。

seen集合去重。

## 三、它和谁协作

- KnowledgeScope的document_filters持有它。
- RAGFlow检索工具用它约束文档范围。

## 四、重要性评级

评级是4分。

理由如下。

这个类是一个dataset的文档过滤契约。

ID去重保持输入顺序。

1000条上限。

extra=forbid继承自_StrictModel。

扣掉6分。

扣分原因是它是小验证模型。
