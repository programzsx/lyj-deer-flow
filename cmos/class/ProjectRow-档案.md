# ProjectRow-档案

## 一、这个类是干什么的

ProjectRow是persistence/projects/model.py里的ORM模型。

这个类是用户拥有的项目的持久化行。

projects表。

每个用户拥有的项目一行。

id是唯一的外部身份。

name和presentation是展示属性。

改名只碰这一行。不影响成员关系。

线程通过threads_meta.project_id引用项目。

instructions是用户编写的项目上下文。

Phase 1存储并PATCH它。Phase 2注入它。

故意没有memory_mode、共享、代理配置列。

Phase 1和2没有消费者。

这个类位于backend/packages/harness/deerflow/persistence/projects/model.py。

## 二、类的成员（字段，各自做什么）

### 1、ProjectRow字段

- id是主键。uuid4 hex。唯一的外部身份。
- user_id是拥有者。有索引。
- name是项目名。展示属性。
- instructions是用户编写的项目上下文。默认空。
- presentation是JSON列。展示属性。
- status是状态。默认active。有索引。
- created_at和updated_at是时间戳。

### 2、ProjectDocumentRow

同模块的另一个模型。

project_documents表。

每个项目架文档一行。

- id是主键。
- project_id和user_id有索引。
- name是文档名。
- stored_relpath是服务器生成的内容地址。相对于users/{user_id}/projects/。内嵌sha256和行自己的id。行从不共享文件。trash后重新上传总是落在新的命名空间。
- sha256是内容摘要。有索引。
- size_bytes是大小。
- source_thread_id、source_kind、source_name记录晋升provenance。
- trashed_at和trash_origin实现可恢复的trash层。

每个读查询过滤trashed_at IS NULL。

trashed行对索引、工具、列表API不可见。

架子设计上没有历史。所以没有mime、is_text、version、deleted_by列。

文本检测是serve时间的采样读。

## 三、它和谁协作

- ProjectRepository和ProjectDocumentRepository读写这些模型。
- threads_meta的project_id引用项目。
- projects/documents.py的架子逻辑消费文档行。
- trash层支持恢复。

## 四、重要性评级

评级是5分。

理由如下。

这个模型是项目功能的存储基础。

stored_relpath的内容地址设计让行不共享文件。

trash层的可恢复设计。

文档行内嵌sha256。

但它只是数据行。

没有逻辑。

扣掉5分。
