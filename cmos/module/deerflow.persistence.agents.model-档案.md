# deerflow.persistence.agents.model-档案

## 一、这个模块是干什么的

这个模块定义自定义agent定义的ORM模型。

模型类叫AgentRow。

模型对应数据库里的agents表。

一行代表一个(user_id, name)的自定义agent。

config列存完整的AgentConfig文档。

文档里去掉name。

name是自然键。

name由单独的name列承载。

config用单个JSON文档存储而不是一列一个字段。

这是有意的。

代码库通过preserve_non_managed_fields声明。

声明的内容是AgentConfig未来加的任何字段必须能被不知道它的写入方round-trip。

文档列满足这个要求。

新字段不需要迁移。

查询只有两种。

按(user_id, name)查。

按用户列表查。

这两种正好都是索引列。

## 二、模块里的主要成员

### 1、AgentRow类

AgentRow继承自Base。

AgentRow对应agents表。

agents表由alembic迁移0006创建。

#### （1）id列

id是代理主键。

id用uuid4的hex。

自然键是(user_id, name)。

唯一约束强制自然键。

代理主键让行身份保持稳定。

行身份稳定是为了将来agent改名时不乱。

#### （2）user_id列

user_id是拥有者。

user_id有索引。

#### （3）name列

name是agent名字。

name存小写形式。

小写形式和磁盘布局一致。

Paths.user_agent_dir也是小写。

#### （4）config列

config是JSON列。

config存AgentConfig文档。

文档不含name。

默认空字典。

#### （5）soul列

soul是Text列。

soul存SOUL.md的内容。

默认空字符串。

#### （6）created_at列和updated_at列

created_at是创建时间。

updated_at是更新时间。

updated_at带onupdate钩子。

onupdate钩子在每次更新时自动刷新时间。

时区是UTC。

## 三、它和谁协作

### 1、它依赖谁

它依赖deerflow.persistence.base的Base。

它依赖SQLAlchemy的列类型。

### 2、谁依赖它

agents/sql.py的SqlAgentStore用AgentRow读写行。

agents/sql.py的signature方法扫描AgentRow的全部行。

migrations/versions/0006_agents.py创建这张表。

bootstrap.py的canonical-0019 floor列出这张表的列。

## 四、重要性评级

评级是6分。

理由如下。

agent存储的db后端靠这张表。

文档式存储的设计理由在这里被记录。

命名和排序约定在这里被固定。

扣分的原因是表结构很简单。

八个列没有复杂关系。

真正的读写逻辑在sql.py里。
