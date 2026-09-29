# KnowledgeDisplayDataset-档案

## 一、这个类是干什么的

KnowledgeDisplayDataset是knowledge_scope.py里的pydantic模型。

它继承_StrictModel。extra=forbid。

它是display块里的一个dataset条目。

字段是id加name加documents。

这个类位于backend/packages/harness/deerflow/knowledge_scope.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

id是dataset ID。

name是显示名。最少1码点最多256码点。必须非空。

documents是KnowledgeDisplayDocument列表。最多50条。可None。

### 2、_normalize验证器

id经过_clean_id。1到256码点。

name必须非空。

documents存在时检查ID重复。display document ID不能重复。

## 三、它和谁协作

- KnowledgeScopeDisplay的datasets持有它。
- KnowledgeScope的验证器检查它属于selected的dataset。
- KnowledgeDisplayDocument是它的成员。

## 四、重要性评级

评级是3分。

理由如下。

这个类是display dataset条目。

ID和name验证。documents ID去重。

三个字段。验证逻辑小。

扣掉7分。

扣分原因是它是小展示模型。
