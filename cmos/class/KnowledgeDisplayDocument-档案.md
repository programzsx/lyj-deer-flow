# KnowledgeDisplayDocument-档案

## 一、这个类是干什么的

KnowledgeDisplayDocument是knowledge_scope.py里的pydantic模型。

它继承_StrictModel。extra=forbid。

它是display块里的一个文档条目。

字段是id加name。

这个类位于backend/packages/harness/deerflow/knowledge_scope.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

id是文档ID。1到256码点。

name是显示名。最少1码点最多256码点。必须非空。

### 2、_normalize验证器

id经过_clean_id。

name必须非空。

### 3、父级约束

KnowledgeScope的验证器要求display document必须属于对应的document filter。

display声称未授权的文档会被拒绝。

## 三、它和谁协作

- KnowledgeDisplayDataset的documents持有它。
- KnowledgeScope的验证器检查它属于filter。

## 四、重要性评级

评级是3分。

理由如下。

这个类是display文档条目。

两个字段。ID和name验证。

父级约束防止display声称未授权文档。

扣掉7分。

扣分原因是它是两个字段的小模型。
