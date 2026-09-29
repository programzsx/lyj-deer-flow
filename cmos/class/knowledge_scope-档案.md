# knowledge_scope-档案

## 一、这个类是干什么的

knowledge_scope不是单一类。

knowledge_scope是deerflow包根下的一个模块。

这个模块定义带版本的消息级知识检索作用域契约。

核心问题如下。

消息快照里可能带一个不受信任的display块。

display块是给历史UI渲染用的。

运行时消费方必须用execution_scope。

execution_scope只投影能约束检索的字段。

display块不参与检索。

这个模块定义KnowledgeScope及其配套结构。

这个模块位于backend/packages/harness/deerflow/knowledge_scope.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、常量

- KNOWLEDGE_SCOPE_KEY的值是"knowledge_scope"。这是消息additional_kwargs里的快照键。
- KNOWLEDGE_SCOPE_RUNTIME_KEY的值是"__knowledge_scope_execution"。这是运行时键。
- KNOWLEDGE_SCOPE_VERSION是1。这是契约版本。
- MAX_KNOWLEDGE_SCOPE_BYTES是64KiB。这是作用域快照的字节上限。
- MAX_DATASET_IDS是100。MAX_DOCUMENT_IDS是1000。
- MAX_DISPLAY_DATASETS是20。MAX_DISPLAY_DOCUMENTS是50。
- MAX_ID_CODEPOINTS和MAX_DISPLAY_NAME_CODEPOINTS是256。

### 2、_StrictModel

这是严格模型基类。

model_config设置extra="forbid"。

多余字段被拒绝。

这是所有作用域模型的基类。

### 3、KnowledgeDocumentFilter

这个类表示一个数据集的文档过滤器。

- dataset_id是数据集id。
- document_ids是文档id列表。长度在1到1000之间。

验证器清洗id并去重。

### 4、KnowledgeDisplayDocument

这个类表示展示用的文档。

- id是文档id。
- name是展示名。名字不能空白。

### 5、KnowledgeDisplayDataset

这个类表示展示用的数据集。

- id是数据集id。
- name是展示名。
- documents是可选的展示文档列表。最多50个。

验证器要求展示文档id不重复。

### 6、KnowledgeScopeDisplay

这个类表示作用域的展示块。

- datasets是展示数据集列表。最多20个。

### 7、KnowledgeScope

这个类是一个用户轮次的消息快照。

字段如下。

- version必须是1。
- mode是"all"、"selected"、"disabled"之一。
- dataset_ids是数据集id列表。selected模式必填。
- document_filters是文档过滤器列表。
- display是可选的展示块。

验证逻辑很完整。

all和disabled模式不允许带选择或display。

selected模式要求至少一个数据集id。

每个数据集最多一个文档过滤器。

过滤器必须属于已选数据集。

文档id总数不超过1000。

display数据集必须属于已选数据集。

display文档必须有对应的显式文档过滤器。

display文档必须属于对应的过滤器。

最后校验整体大小不超过64KiB。

### 8、canonicalize_knowledge_scope函数

这个函数验证并返回稳定的JSON安全表示。

### 9、execution_scope函数

这个函数只返回执行字段。

去掉display块。

display是给UI的。

运行时只用执行字段。

### 10、strip_message_knowledge_scope函数

这个函数复制LangChain消息并去掉知识作用域快照。

从additional_kwargs里移除两个键。

## 三、它和谁协作

- KnowledgeScopeMiddleware消费execution_scope并按作用域过滤检索。
- 消息快照的additional_kwargs携带KNOWLEDGE_SCOPE_KEY。
- Gateway的知识库路由生成作用域。

## 四、重要性评级

评级是6分。

理由如下。

这个模块是知识检索范围的契约。

它把不受信任的display块和执行字段分开。

display不能影响检索。

大小限制防止作用域快照膨胀。

严格模型防止多余字段。

验证逻辑完整且带版本。

但它只是数据契约和验证。

检索本身不在这里。

扣掉4分。
