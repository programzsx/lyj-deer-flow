# deerflow.persistence.managed_subagents.model-档案

## 一、这个模块是干什么的

这个模块定义部署级托管subagent定义的ORM模型。

模型类叫ManagedSubagentRow。

模型对应数据库里的managed_subagents表。

托管subagent是管理员定义的worker。

worker的定义不放在config.yaml里。

定义放在数据库里。

多实例部署的每个节点都能看到同一份定义。

## 二、模块里的主要成员

### 1、ManagedSubagentRow类

ManagedSubagentRow继承自Base。

ManagedSubagentRow对应managed_subagents表。

表由alembic迁移0014创建。

#### （1）id列

id是主键。

id用uuid4的hex。

长度64。

#### （2）name列

name是自然键。

name有unique约束。

一个名字只能有一个定义。

name长度128。

#### （3）definition列

definition是JSON列。

definition存完整的ManagedSubagentDefinition文档。

默认空字典。

用单个JSON文档存储。

新增定义字段不需要迁移。

#### （4）created_at列和updated_at列

created_at是创建时间。

updated_at是更新时间。

updated_at带onupdate钩子。

onupdate钩子在每次更新时自动刷新。

时区是UTC。

## 三、它和谁协作

### 1、它依赖谁

它依赖deerflow.persistence.base的Base。

### 2、谁依赖它

managed_subagents/sql.py的SqlManagedSubagentStore用ManagedSubagentRow读写行。

SqlManagedSubagentStore的signature方法扫描全部行的updated_at。

migrations/versions/0014_managed_subagents.py创建这张表。

bootstrap.py的canonical-0019 floor列出这张表的列。

## 四、重要性评级

评级是5分。

理由如下。

托管subagent的db后端靠这张表。

单name唯一约束保证了定义的身份。

文档式存储让定义字段可以自由演进。

扣分的原因是表结构非常简单。

五个列没有任何复杂关系。

托管subagent是辅助功能。

核心读写逻辑在sql.py里。
