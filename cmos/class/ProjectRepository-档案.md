# ProjectRepository-档案

## 一、这个类是干什么的

ProjectRepository是persistence/projects/sql.py里的类。

它是项目的持久仓库。

管理项目行的CRUD加状态。

ProjectNotAssignableError是线程不能分配到项目时抛出。

项目缺失、外来于调用者、或已归档。

原子性规则让这些在mutating语句里不可区分。

调用方得到一个信号。映射到404或dropped key。

这个类位于backend/packages/harness/deerflow/persistence/projects/sql.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、ProjectNotAssignableError

线程不能分配到项目时抛出。

ValueError子类。

项目缺失、外来、归档。

原子性规则让这些在mutating语句里不可区分。

显式API映射到404。run admission用dropped key。

### 2、ProjectRepository方法

create创建项目。带name、instructions、presentation。

status默认active。

get取项目。user_id不匹配返回None。owner过滤。

list按created_at加id排序。可按status过滤。

patch部分更新。

set_status是幂等状态flip。返回当前行或None。

### 3、delete方法

delete在一个事务里删项目并清成员关系。

无文件系统工作。

FOR UPDATE锁项目行。

Postgres锁。SQLite渲染为空。

成员分配拿同一行锁再写project_id。

分配者要么先提交且成员关系在下面被清除。

要么阻塞到这个事务提交然后重读行已消失。

没有悬空的threads_meta.project_id。RFC v2 §14.14。

§8.1语句2。每个活跃架行在同一事务和锁里移进trash。

永不留下活跃行指向已删除项目。

resolved_user_id非None时清成员关系带user过滤。

## 三、它和谁协作

- ProjectRow是ORM行。
- ThreadMetaRow的project_id是成员关系。
- ProjectDocumentRepository的trash_all_for_project移架行进trash。
- projects/documents.py和trash.py消费。

## 四、重要性评级

评级是7分。

理由如下。

这个仓库是项目持久化的核心。

delete的行锁顺序防悬空成员关系。

架行同事务进trash。

owner过滤贯穿。

ProjectNotAssignableError的单一信号。

这些是项目原子性的关键。

扣掉3分。

扣分原因是它是数据访问层。
