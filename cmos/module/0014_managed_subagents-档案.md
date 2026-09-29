# 0014_managed_subagents档案

## 一、这个迁移是干什么的

创建`managed_subagents`表。部署级别的托管子代理。管理员定义一个部署里可用的子代理。

## 二、做了什么schema变更

- 创建`managed_subagents`表。id、name、definition（JSON）、创建更新时间。
- name唯一约束。

## 三、涉及哪些表

只涉及`managed_subagents`表。

## 四、重要细节

幂等。表已存在时创建跳过。降级时表存在才删。

## 五、重要性评级

评级是5分。

理由。managed_subagents让部署可以定义共享的子代理。这是子代理系统的部署级扩展。变更本身是标准建表。
