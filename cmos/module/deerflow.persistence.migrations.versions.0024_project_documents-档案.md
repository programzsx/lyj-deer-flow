# 0024_project_documents档案

## 一、这个迁移是干什么的

创建`project_documents`表。Projects阶段二切片B的文件架。项目可以带文档。文档支持回收站。

## 二、做了什么schema变更

- 创建`project_documents`表。id、project_id、user_id、name、stored_relpath、sha256、size_bytes、来源信息（source_thread_id、source_kind、source_name）、回收站信息（trashed_at、trash_origin JSON）、时间字段。
- 四个索引。project_id、user_id、sha256、trashed_at。

## 三、涉及哪些表

只涉及`project_documents`表。

## 四、重要细节

sha256索引支持去重和完整性验证。trashed_at索引支持回收站清理。stored_relpath存相对路径。

## 五、重要性评级

评级是5分。

理由。project_documents是项目文件功能的存储基础。文档带来源信息和回收站。sha256支持去重。变更本身是标准建表。
