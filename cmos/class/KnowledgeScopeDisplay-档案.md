# KnowledgeScopeDisplay-档案

## 一、这个类是干什么的

KnowledgeScopeDisplay是knowledge_scope.py里的pydantic模型。

它继承_StrictModel。extra=forbid。

它表示knowledge scope的不受信任display块。

display是历史UI渲染用的。

运行时消费者必须用execution_scope。不用display。

这个文档覆盖KnowledgeScopeDisplay加KnowledgeDisplayDataset、KnowledgeDisplayDocument。

位于backend/packages/harness/deerflow/knowledge_scope.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、KnowledgeScopeDisplay字段

datasets是KnowledgeDisplayDataset列表。最多20条。

### 2、KnowledgeDisplayDataset字段

id是dataset ID。

name是显示名。最少1码点最多256码点。必须非空。

documents是KnowledgeDisplayDocument列表。最多50条。可None。

dataset级验证。ID去重。display document ID不能重复。

### 3、KnowledgeDisplayDocument字段

id是文档ID。

name是显示名。最少1码点最多256码点。

### 4、display块的信任边界

display可能包含不受信任内容。用于历史UI渲染。

KnowledgeScope的验证器检查display dataset必须属于selected的dataset。

display document必须有对应的document filter。且属于那个filter。

display声称未授权的文档会被拒绝。

execution_scope排除display。

## 三、它和谁协作

- KnowledgeScope的display字段持有它。
- execution_scope排除它。
- 历史UI渲染消费它。

## 四、重要性评级

评级是5分。

理由如下。

这个模型是display块的验证边界。

display dataset和document必须属于已授权范围。

ID不能重复。名字非空且有上限。

execution_scope排除display。运行时不受它影响。

这些防止display块变成授权旁路。

扣掉5分。

扣分原因是它是展示层数据模型。自身无检索逻辑。
