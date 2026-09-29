# ProjectDocumentRow-档案

## 一、这个类是干什么的

ProjectDocumentRow是persistence/projects/model.py里的ORM模型。

它是一个project shelf文档的行。

每个project shelf文档一行。

这个文档覆盖ProjectDocumentRow加ProjectRow。

位于backend/packages/harness/deerflow/persistence/projects/model.py。

## 二、类的成员（字段，各自做什么）

### 1、ProjectDocumentRow字段

id是行id。uuid4 hex。

project_id是所属project。

user_id是owner。

name是文档名。

stored_relpath是服务器生成的内容地址。相对于users/{user_id}/projects/。

它嵌入sha256和行自己的id。

所以行之间永不共享文件。

trash后重新上传总是落在新的命名空间。

sha256是内容哈希。有索引。

size_bytes是大小。

source_thread_id、source_kind、source_name记录promotion来源。Slice C。

trashed_at和trash_origin实现可恢复的trash层。

每个读查询过滤trashed_at IS NULL。

trashed行对索引、工具、listing API不可见。

### 2、为什么没有mime、is_text、version、deleted_by列

文本检测是serve time的抽样读。

shelf设计上没有历史。

所以没有这些列。Phase-2 spec §6.1。

### 3、ProjectRow字段

id是uuid4 hex。唯一的外部身份。

name和presentation是显示属性。

重命名只碰这一行。不影响成员关系。

threads引用threads_meta.project_id。

instructions是用户写的project context。Phase 1存储和PATCH。Phase 2注入。

故意没有memory_mode、sharing、agent-config列。Phase 1和2没有消费者。RFC v2 §3、§4.1。

status是active。有索引。

## 三、它和谁协作

- ProjectDocumentRepository和ProjectRepository操作这些行。
- projects/trash.py实现trash层。
- stored_relpath指向users/{user_id}/projects/下的文件。

## 四、重要性评级

评级是6分。

理由如下。

这个类是project shelf文档的持久化契约。

stored_relpath嵌入sha256和行id。行之间不共享文件。trash后重上传落新命名空间。

trash层用trashed_at过滤。读查询永不看到trashed行。

ProjectRow的重命名只碰一行。不影响成员关系。

没有多余的列。故意设计。

这些是项目存储正确性的关键。

扣掉4分。

扣分原因是它是ORM行模型。逻辑在repository里。
