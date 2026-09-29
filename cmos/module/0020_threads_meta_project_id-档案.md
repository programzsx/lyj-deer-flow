# 0020_threads_meta_project_id档案

## 一、这个迁移是干什么的

给`threads_meta`加`project_id`列。把线程归属到项目。

## 二、做了什么schema变更

- 给`threads_meta`加`project_id`列。String(64)。可为NULL。
- 创建索引`ix_threads_meta_project_id`。

## 三、涉及哪些表

只涉及`threads_meta`表。

## 四、重要细节

用`safe_add_column`做幂等。索引创建幂等。降级先删索引再删列。

## 五、重要性评级

评级是5分。

理由。project_id把线程和项目关联起来。项目视图需要知道哪些线程属于项目。变更本身是一列加一个索引。
