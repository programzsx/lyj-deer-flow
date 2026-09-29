# deerflow.persistence.projects-档案

源码路径：backend/packages/harness/deerflow/persistence/projects/__init__.py

## 一、这个包是干什么的

这个包负责项目（Project）的持久化。

项目是用户组织thread和文档的容器。

一个用户可以建多个项目。

thread可以归属到某个项目。

文档可以放进项目的架子（shelf）。

这个包管理两张表。

表是projects和project_documents。

## 二、包里的主要成员

（1）model.py的两个Row

ProjectRow对应projects表。

一行代表一个用户拥有的项目。

字段如下。

id是外部身份。

id是uuid4 hex。

user_id是属主。

user_id有索引。

name是项目名。

instructions是用户写的项目上下文。

Phase 1只存储和PATCH它。

Phase 2才注入它。

presentation是展示属性JSON。

status是状态。

status默认active。

status有索引。

created_at和updated_at是时间戳。

改名只动这一行。

改名不影响成员关系。

thread引用的是threads_meta.project_id。

这张表故意没有memory_mode、共享、agent-config列。

Phase 1和Phase 2没有消费者。

ProjectDocumentRow对应project_documents表。

一行代表一个架子文档。

字段如下。

id是主键。

project_id和user_id有索引。

name是文档名。

stored_relpath是服务端生成的内容地址。

地址相对于users/{user_id}/projects/。

地址内嵌sha256和行自己的id。

行之间不共享文件。

删除后重新上传会落在新命名空间。

sha256有索引。

size_bytes是大小。

source_thread_id、source_kind、source_name记录来源。

这三个字段记录从哪里晋升来的。

trashed_at和trash_origin实现可恢复的回收站。

每个读查询都过滤trashed_at IS NULL。

trashed的行对索引、工具、列表API都不可见。

架子故意没有历史。

所以没有mime、is_text、version、deleted_by列。

（2）sql.py的两个Repository

ProjectRepository管理项目行。

方法包括create、get、list、patch、set_status、delete。

delete会先锁项目行。

delete在同一事务里清空成员关系。

ProjectNotAssignableError表示项目不可指派。

项目缺失、别人的、已归档时抛出。

ProjectDocumentRepository管理架子文档。

方法包括insert_active、find_active_by_sha256、list_active、count_active。

还有shelf_snapshot、get、trash、restore、purge、purge_candidates。

insert_active在活跃项目锁下插入。

trash把文档移入回收站。

restore从回收站恢复。

purge_candidates按保留天数找候选。

purge真正删除。

还有list_trashed、count_trashed、list_all_trashed、list_all_for_sweep。

## 三、它和谁协作

Gateway的deps.py构造这两个仓库。

Gateway的threads路由用项目校验。

thread_meta包依赖这个包。

ThreadMetaRepository.create和set_project锁ProjectRow。

锁定防止悬空的threads_meta.project_id。

deerflow.projects包的context、documents、tools、trash模块调用这两个仓库。

数据库表由持久层的Alembic引导创建。

migration 0019和0024建了这两张表。

## 四、重要性评级

评级：6分。

理由：

项目是组织thread和文档的重要功能。

项目删除和thread归属的一致性靠这个包的锁纪律。

但项目是可选的组织层。

不用项目的用户完全不碰这两张表。

thread和run数据不在项目表里。

所以这个包是6分。
