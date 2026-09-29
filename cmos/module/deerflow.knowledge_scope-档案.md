# deerflow.knowledge_scope-档案

## 一、这个模块是干什么的

这个文件是知识检索范围的版本化契约模块。

知识检索范围定义一次检索允许覆盖哪些数据集和文档。

这个文件定义了KnowledgeScope模型。

KnowledgeScope跟着消息快照走。

消息快照里还可能带一个display展示块。

display块只用于历史UI渲染，是不可信数据。

运行时消费方必须用execution_scope。

execution_scope只投影能约束检索的字段。

## 二、模块里的主要成员

### 1、KnowledgeScope模型

KnowledgeScope是pydantic模型。

配置是extra=forbid，多余字段直接拒绝。

模型有这些字段。

version固定是1。

mode是all、selected、disabled三种。

dataset_ids是选中的数据集id列表。

document_filters是每个数据集的文档过滤。

display是展示块。

### 2、校验规则

模型校验器执行一组规则。

mode是all或disabled时，不允许携带任何选择或展示数据。

mode是selected时，至少要有一个数据集id。

每个数据集最多一个文档过滤。

文档过滤必须属于选中的数据集。

文档id总数最多1000。

display数据集必须属于选中的数据集。

display文档必须有对应的文档过滤。

display总数最多50。

整体JSON序列化后不能超过64KB。

### 3、ID清理

_clean_id清理id字符串。

id必须是非空字符串。

id最多256个码点。

_stable_unique_ids去重并保持顺序。

### 4、display块校验

KnowledgeScopeDisplay和它的子模型独立校验。

display名字不能为空白。

display文档id不能重复。

display只用于给人看。

display不参与检索约束。

### 5、模块级函数

canonicalize_knowledge_scope校验并返回稳定的JSON表示。

序列化用排序键和紧凑分隔符。

这样同一个scope总是产生同样的字节。

execution_scope返回去掉display的执行字段。

strip_message_knowledge_scope复制一条LangChain消息并剥掉knowledge scope快照。

## 三、它和谁协作

它依赖pydantic。

它被运行时的检索工具和消息处理路径引用。

task_tool和batch_task_tool会把runtime context里的knowledge scope转换成执行字段传给子智能体。

Gateway的请求处理会剥离消息里的scope快照。

## 四、重要性评级

评级是6分。

理由是这个文件定义了知识检索的安全边界。

范围约束决定了检索能看到哪些数据。

校验规则挡住了display块混入执行路径。

64KB和数量上限挡住了超大payload。

不评高分的原因是知识库功能本身是可选的。

功能不开启时这个模块不参与运行。
