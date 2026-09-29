# 0001_baseline档案

## 一、这个迁移是干什么的

这是Alembic迁移链的根。它编码了Alembic接入时DeerFlow全部自有表的schema。

在混合引导策略下这个迁移的`upgrade()`几乎从不执行。全新数据库走`create_all`加`alembic stamp head`。旧数据库直接stamp到这个位置然后升级到head。只有恰好停在base的数据库才真正运行这个upgrade。

所以这个迁移主要充当stamp目标和链根。upgrade保持和`Base.metadata`一致是为了测试可以往返。

## 二、做了什么schema变更

创建了九张表。

- `runs`，运行记录。运行状态、模型名、token用量、错误、消息计数、follow-up引用。
- `run_events`，运行事件流。thread加seq唯一约束。
- `threads_meta`，线程元数据。
- `users`，用户。邮箱、密码哈希、系统角色、OAuth身份。OAuth身份带部分唯一索引。
- `feedback`，反馈。
- `channel_connections`，IM渠道连接。活跃身份有部分唯一索引。
- `channel_oauth_states`，渠道OAuth状态。
- `channel_conversations`，渠道对话。
- `channel_credentials`，渠道凭证。加密token。

LangGraph的checkpointer表被故意排除。那些表属于LangGraph。由`env.py::include_object`排除。

## 三、重要细节

全部表和索引用批量alter创建。兼容SQLite。部分唯一索引带SQLite和PostgreSQL的where子句。

## 四、重要性评级

评级是8分。

理由。这是迁移链的根。后续全部迁移都依赖它。九张表是DeerFlow数据层的全部基础。没有它，Alembic就没有起点。
