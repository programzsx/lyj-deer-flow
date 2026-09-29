# ProjectDocumentRepository-档案

## 一、这个类是干什么的

ProjectDocumentRepository是persistence/projects/sql.py里的类。

它是项目架文档的持久仓库。

哈希限定的行加可恢复的trash层。

每个读都过滤trashed_at IS NULL。

除非显式要求。

trashed行对架索引、工具、listing API不可见。

写遵循Phase-1锁习惯。

SQLite先拿写锁。BEGIN IMMEDIATE。

Postgres靠projects行的SELECT FOR UPDATE。

存在、所有权、状态验证在mutating事务里发生。

从不是分离的check-then-act读。Phase-2规格§6.3和§15.5。

这个类位于backend/packages/harness/deerflow/persistence/projects/sql.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_begin_immediate_if_sqlite

SQLite先拿写锁。

读然后写事务。

并发写者不能在项目锁和mutation之间交错。

ThreadMetaRepository先例。

### 2、_lock_active_project

它在事务里锁拥有的status为active的项目行。

缺失、外来、归档时返回None。

### 3、insert_active方法

它在active-project锁下插入一个架行。或返回dedup命中。

一个事务。

锁拥有的active项目行。

dedup SELECT在active的(project_id, sha256)行之间。

miss时调用place_file。

place_file是staging到final的原子rename进文档独占命名空间。

在INSERT之前。

这叫file-before-row。

崩溃留下无引用文件由清扫收集。

永不留下有行没字节。

dedup命中跳过placement。返回已有行。

第一个写者的名字和来源信息赢。

调用方用row的id不等于document_id识别命中。

### 4、trash_all_for_project

它把项目的所有活跃架行移进trash。

在同一事务和锁里。

§8.1语句2。

### 5、stage_live_copy

它在文档行锁下staging活文档的稳定副本。

attach路径用。

### 6、convert_under_live_lock

它在活锁下转换。

惰性转换用。

### 7、restore方法

恢复trashed文档到目标项目。

### 8、purge_candidates和purge

purge_candidates按保留天数列候选。

purge在守卫的行锁事务里purge。

字节先删。行后删。

### 9、_row_to_dict

时间戳用coerce_iso规整。

包括trashed_at。

## 三、它和谁协作

- ProjectDocumentRow是ORM行。
- ProjectRow是项目行。
- projects/documents.py消费insert_active、convert_under_live_lock、stage_live_copy。
- projects/trash.py消费restore、purge、purge_candidates。

## 四、重要性评级

评级是8分。

理由如下。

这个仓库是项目架文档的持久核心。

file-before-row原子性。

dedup命中第一个写者赢。

锁习惯SQLite先拿写锁。

trashed行对索引和API不可见。

trash_all_for_project同事务移架。

restore和purge的守卫事务。

这些是文档架正确性的关键。

扣掉2分。

扣分原因是它是数据访问层。
