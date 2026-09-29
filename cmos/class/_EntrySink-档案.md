# _EntrySink-档案

## 一、这个类是干什么的

_EntrySink是tools/artifact_registry.py里的类。

它分配顺序的per-result序号。

一个工具结果里的每个提取出的引用得到一个不同的handle。

这个类位于backend/packages/harness/deerflow/tools/artifact_registry.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、构造方法字段

occurrence_id是出现id。可None。

thread_id、tool_call_id、call_index是作用域。

created_at是创建时间。

tool_name是工具名。

_next_ordinal是下一个序号。从0开始。

### 2、add方法

它添加一个artifact entry。

generate_handle用当前序号生成handle。

handle是thread_id、tool_call_id、call_index、ordinal的组合。

entry带artifact_type、display_name、real_ref、created_at、mime_type。

_next_ordinal递增。

### 3、generate_handle函数

它生成引用handle。

按thread、tool call、call index、ref ordinal组合。

occurrence_id可选。

### 4、extract_artifacts_from_result的关系

它从ToolMessage提取artifacts。

它用_EntrySink分配每个引用的不同handle。

## 三、它和谁协作

- extract_artifacts_from_result使用它。
- generate_handle和_make_entry生成entry。
- ArtifactEntry是结果条目。

## 四、重要性评级

评级是4分。

理由如下。

这个类是artifact提取的序号分配器。

每个引用得到不同的handle。

ID是每次提取唯一的。不是per-message序号ID。

只有实际发出的entry得到source记录。

扣掉6分。

扣分原因是它是内部分配器。逻辑量小。
