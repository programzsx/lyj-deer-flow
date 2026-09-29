# AgentRow-档案

## 一、这个类是干什么的

AgentRow是persistence/agents/model.py里的ORM模型。

这个类是自定义代理定义的ORM行。

每个(user_id, name)自定义代理一行。

config列持有完整的AgentConfig文档。

不包括name。name是自然键，由name列承载。

config存成单个JSON文档而不是每字段一列。

这是故意的。

代码库通过preserve_non_managed_fields声明。

AgentConfig未来加的任何字段必须经由不知道它的writer往返。

文档列零schema churn地尊重这个不变式。

新的AgentConfig字段不需要迁移。

这个类位于backend/packages/harness/deerflow/persistence/agents/model.py。

## 二、类的成员（字段、方法，各自做什么）

字段如下。

- id是代理主键。uuid4 hex。自然键是(user_id, name)，由UNIQUE约束强制。代理主键让行身份在将来代理改名时保持稳定。
- user_id是用户标识。有索引。
- name是代理名。存储为小写。和磁盘布局匹配。
- config是JSON列。默认空字典。存完整AgentConfig文档减name。
- soul是Text列。默认空字符串。存SOUL.md内容。
- created_at和updated_at是带时区的DateTime。自动更新。

表级约束是uq_agents_user_name。

这是(user_id, name)的唯一约束。

它继承persistence/base的Base。

有to_dict和__repr__。

## 三、它和谁协作

- SqlAgentStore读写这个模型。
- persistence/base的Base提供序列化。
- postgres_schema和migrations管理表结构。

## 四、重要性评级

评级是5分。

理由如下。

这个模型是db后端的代理存储行。

JSON文档列的设计尊重preserve_non_managed_fields的不变式。

零schema churn。

代理主键让改名稳定。

但它是纯ORM模型。

只有字段声明。

扣掉5分。
