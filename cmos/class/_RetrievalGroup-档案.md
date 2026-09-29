# _RetrievalGroup-档案

## 一、这个类是干什么的

_RetrievalGroup是community/ragflow/tools.py里的冻结数据类。

它表示一组按embedding model分组的检索目标。

字段是embedding_model、dataset_ids、document_ids。

slots启用。

这个类位于backend/packages/harness/deerflow/community/ragflow/tools.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、字段

embedding_model是这组的embedding模型名。

dataset_ids是dataset ID列表。

document_ids是文档ID列表。可None。

### 2、分组检索的原因

RAGFlow的一次检索请求只支持一个embedding model。

同一embedding model的dataset分到一组。

每组发一次检索请求。

document_ids跨组分配。

## 三、它和谁协作

- ragflow工具构建它。
- RAGFlowClient的retrieve对每组发请求。
- _ResolvedDataset提供embedding model。

## 四、重要性评级

评级是3分。

理由如下。

这个类是检索分组的载体。

三个字段。embedding model加dataset加文档。

分组让跨embedding model检索可行。

扣掉7分。

扣分原因是它是纯数据载体。
