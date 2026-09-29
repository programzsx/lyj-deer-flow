# SweepReport-档案

## 一、这个类是干什么的

SweepReport是projects/trash.py里的数据类。

它表示一次保留清扫运行的可观测结果。

projects/trash.py是trash层服务。

它实现恢复编排、守卫的purge、保留清扫。

restore是数据库重新指向。

stored_relpath是projects根相对的。

所以恢复时没有任何文件移动。

purge在仓库持续行锁的事务里unlink原文和converted.md。

FileNotFoundError算已移除。

其他unlink错误回滚行删除。保持trashed行可重试。

保留清扫在trash listing上惰性运行。

Gateway启动时运行一次。

没有daemon。

清扫对过期行调用同样的守卫purge。

然后reconcile存储。只针对超过24小时的.staging和无引用文件。

并检测内容缺失或大小不匹配的行。只检测。永不删除。

这个类位于backend/packages/harness/deerflow/projects/trash.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、SweepReport本身

字段是purged、purge_failures、orphans_removed、staging_removed、content_missing。

purged是实际purge的行数。

purge_failures是失败的purge数。

orphans_removed是移除的无引用文件数。

staging_removed是移除的staging条目数。

content_missing是内容缺失的document id列表。

### 2、恢复编排

restore_document恢复trashed文档到活跃目标项目。

恢复是薄编排。

唯一文件系统工作是提交后的merge清理。

移除被丢弃的命名空间。

没有存活行能引用它。

失败时日志记录。留给清扫。

正确性检查都在仓库的锁事务里发生。

恢复前的只读probe不决定任何事。

### 3、守卫的purge

make_purge_file_remover构建purge的remove_files钩子。

钩子在purge事务里运行。持续在文档行锁下。

purge_all_trashed清空调用者的trash。

清空trash删除用户确认的东西。

保留cutoff在这里不起作用。

每行走同样的守卫行锁purge。

字节先删。行后删。在一个事务里。

restore赢竞争时行保持不动。

unlink错误回滚该行。保持可重试。

### 4、保留清扫

run_trash_retention_sweep运行一次清扫。

由trash listing惰性触发。Gateway启动时触发一次。

过期行走同样的守卫purge。

candidate的trash时间戳和cutoff在purge锁下重新验证。

恢复后又重新trash的行不会按旧过期时间被purge。

单行purge失败保持该行可重试。不中止清扫其余部分。

include_reconciliation为False时跳过reconcile。

重复惰性触发保持便宜。

24小时孤儿守卫。更年轻的永远不会被收集或标记。

在途上传和新鲜写入的行永远不会被清扫。

### 5、存储reconcile

_sweep_project_documents_dir在documents目录下reconcile存储。

移除.staging条目和超过24小时守卫的无引用文件。

行的命名空间完整保护。包括trashed和恢复重新指向后的。

空父目录尽力rmdir。

_reconcile_rows是行侧reconcile。

检测、日志、永不删除。

行是用户对文档的唯一记录。

处置总是从用户把它移进trash开始。

只有显式purge或符合条件的保留purge能移除trashed行。

### 6、阻塞IO

每个文件系统touch都通过run_file_io offload。

tests/blocking_io/test_project_trash.py固定了这些锚点。

## 三、它和谁协作

- ProjectDocumentRepository提供restore、purge、purge_candidates、list_all_for_sweep。
- projects/documents.py提供original_file_path、converted_markdown_path、check_document_content。
- run_file_io和await_drained处理offload。
- trash listing路由惰性触发清扫。

## 四、重要性评级

评级是6分。

理由如下。

这个模块是trash层的完整实现。

恢复、守卫purge、保留清扫、存储reconcile一条链。

FileNotFoundError算已移除的语义防误报。

行锁下purge防restore竞争。

24小时孤儿守卫防止清扫在途上传。

行侧reconcile只检测不删除。

保留用户的处置权。

这些设计都很谨慎。

扣掉4分。

扣分原因是它是trash维护功能。

不在核心执行路径上。
