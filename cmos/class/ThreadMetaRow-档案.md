# ThreadMetaRow-档案

## 一、这个类是干什么的

ThreadMetaRow是persistence/thread_meta/model.py里的ORM模型。

它是thread metadata的行。

tablename是threads_meta。

这个类位于backend/packages/harness/deerflow/persistence/thread_meta/model.py。

## 二、类的成员（字段，各自做什么）

### 1、字段

thread_id是线程id。主键。String(64)。

incarnation是thread化身。可None。

assistant_id是agent id。有索引。

user_id是owner。有索引。

project_id是所属project。有索引。可None。

display_name是显示名。

status是状态。默认idle。String(20)。

metadata_json是JSON元数据。默认空dict。

created_at和updated_at。UTC时间。

### 2、project_id的语义

server保留的deerflow_project_id metadata key是threads_meta.project_id列的只读exposure。

客户端写入被剥离。

thread的project成员由thread创建、branch创建、显式move写入。

run admission不改成员关系。只把解析的project context只读pin进run context。

### 3、incarnation的语义

incarnation是thread化身。

防止删除的thread被为它admitted的写入重新创建状态。

## 三、它和谁协作

- MemoryThreadMetaStore和ThreadMetaRepository操作它。
- Gateway的threads路由读写它。
- deerflow_project_id是它的只读exposure。

## 四、重要性评级

评级是6分。

理由如下。

这个类是thread metadata的持久化契约。

thread_id主键。incarnation防重建。

project_id支撑thread到project成员关系。

status和display_name支撑UI。

metadata_json是可扩展元数据。

它是ThreadMetaStore契约的核心行。

扣掉4分。

扣分原因是它是ORM行模型。逻辑在store里。
