# 0019_projects档案

## 一、这个迁移是干什么的

创建`projects`表。项目功能。用户可以创建项目。项目带指令和展示配置。

## 二、做了什么schema变更

- 创建`projects`表。id、user_id、name、instructions（Text）、presentation（JSON）、status、创建更新时间。
- 索引。user_id和status。

## 三、涉及哪些表

只涉及`projects`表。

## 四、重要细节

幂等。表已存在就跳过。降级时表存在才删。

## 五、重要性评级

评级是5分。

理由。projects表是项目功能的存储基础。指令和展示配置是项目的核心数据。变更本身是标准建表。
