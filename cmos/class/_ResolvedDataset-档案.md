# _ResolvedDataset-档案

## 一、这个类是干什么的

_ResolvedDataset是community/ragflow/tools.py里的冻结数据类。

它表示一个已解析的RAGFlow dataset。

字段是dataset_id、name、embedding_model、chunk_count。

slots启用。

这个类位于backend/packages/harness/deerflow/community/ragflow/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

dataset_id是dataset ID。

name是dataset名称。

embedding_model是embedding模型名。

chunk_count是chunk数。可None。

### 2、用途

检索前解析dataset。

embedding_model用于_RetrievalGroup分组。

同一embedding model的dataset一起检索。

## 三、它和谁协作

- ragflow工具的dataset解析构建它。
- _RetrievalGroup按embedding model分组它。

## 四、重要性评级

评级是3分。

理由如下。

这个类是已解析dataset的载体。

四个字段。slots优化。

embedding_model支撑分组检索。

扣掉7分。

扣分原因是它是纯数据载体。
