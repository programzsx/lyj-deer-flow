# ThreadMetaRepository-档案

## 一、这个类是干什么的

ThreadMetaRepository是persistence/thread_meta/sql.py里的类。

它继承ThreadMetaStore。

它是线程元数据的SQL实现。

sqlite或postgres。via SQLAlchemy。

管理线程行。

包括incarnation、pin、archive、project绑定。

这个类位于backend/packages/harness/deerflow/persistence/thread_meta/sql.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、_row_to_dict

metadata_json改名为metadata。

project_id放进metadata的THREAD_PROJECT_METADATA_KEY。

时间戳用coerce_iso规整。

SQLite丢tzinfo。

wire格式总是带tz。

### 2、create方法

AUTO时从contextvar自动解析user_id。

显式None创建孤儿行。迁移脚本用。

SQLite先BEGIN IMMEDIATE拿写锁。

project_id非None时锁项目行。

FOR UPDATE。

并发ProjectRepository.delete持有同一锁跨成员清除和DELETE。

要么先提交（这个读然后找不到行）。

要么等这个事务。

RFC v2 §14.14。没有悬空的threads_meta.project_id。

locked为None时抛ProjectNotAssignableError。

incarnation生成uuid。

status默认idle。

### 3、claim_unowned方法

它领取无主线程。

user_id为NULL的行设置owner。

迁移和孤儿恢复用。

### 4、set_project方法

设置线程的项目绑定。

同样的行锁顺序。

## 三、它和谁协作

- ThreadMetaStore是基类契约。
- ThreadMetaRow是ORM行。
- ProjectRow锁在create里。
- ProjectRepository的delete持同一锁。

## 四、重要性评级

评级是7分。

理由如下。

这个仓库是线程元数据的SQL核心。

create的项目行锁顺序防悬空project_id。

claim_unowned处理孤儿线程。

SQLite先拿写锁。

wire格式总是带tz。

这些是多用户线程隔离的关键。

扣掉3分。

扣分原因是它是数据访问层。
