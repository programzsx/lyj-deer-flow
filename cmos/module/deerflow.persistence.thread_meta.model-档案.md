# deerflow.persistence.thread_meta.model-档案

## 一、这个模块是干什么的

这个模块定义线程元数据的ORM模型。

模型类叫ThreadMetaRow。

模型对应数据库里的threads_meta表。

线程是用户和Agent的一次会话。

线程元数据描述每个会话线程。

元数据包括名字、状态、拥有者、项目归属、化身标记。

## 二、模块里的主要成员

### 1、ThreadMetaRow类

ThreadMetaRow继承自Base。

ThreadMetaRow对应threads_meta表。

表由alembic迁移0001_baseline创建。

0020加了project_id列。

0019_thread_incarnations加了incarnation列。

#### （1）thread_id列

thread_id是主键。

thread_id是线程的唯一标识。

长度64。

#### （2）incarnation列

incarnation是线程化身。

incarnation可空。

长度32。

化身是随机32字符标记。

化身标识线程的一次生命周期。

MCP任务用化身校验提交是否跨过了线程生命周期边界。

#### （3）assistant_id列

assistant_id是线程使用的agent。

assistant_id有索引。

#### （4）user_id列

user_id是线程拥有者。

user_id可空。

user_id有索引。

为空对应legacy数据。

legacy行可以被claim_unowned认领。

#### （5）project_id列

project_id是所属项目。

project_id有索引。

project_id可空。

没有数据库级外键。

这是有意的。

项目删除先清成员关系。

#### （6）display_name列

display_name是显示名。

长度256。

#### （7）status列

status是线程状态。

默认idle。

#### （8）metadata_json列

metadata_json是JSON元数据。

默认空字典。

置顶、归档、项目标记都存在这里。

#### （9）时间字段

created_at是创建时间。

updated_at是更新时间。

updated_at带onupdate钩子。

时区是UTC。

## 三、它和谁协作

### 1、它依赖谁

它依赖deerflow.persistence.base的Base。

### 2、谁依赖它

thread_meta/sql.py的ThreadMetaRepository用ThreadMetaRow读写。

thread_meta/memory.py是memory模式的对应实现。

projects/sql.py的delete清这个表的成员关系。

mcp_tasks/sql.py用incarnation做化身校验。

migrations/versions/0001_baseline.py创建这张表。

## 四、重要性评级

评级是8分。

理由如下。

threads_meta是系统的核心表。

线程列表、访问控制、项目归属全靠这张表。

incarnation支撑MCP任务的化身校验。

project_id支撑Projects功能。

扣分的原因是它是纯模型文件。

读写逻辑在sql.py里。
