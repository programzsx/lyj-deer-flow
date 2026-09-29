# SqlManagedSubagentStore-档案

## 一、这个类是干什么的

SqlManagedSubagentStore是persistence/managed_subagents/sql.py里的类。

它继承ManagedSubagentStore。

它是managed subagent的SQL行存储。

用共享的同步session factory。

和SqlAgentStore共享同一个engine缓存。

这个类位于backend/packages/harness/deerflow/persistence/managed_subagents/sql.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、cache_identity

它返回("db", url)。

无状态实例指向相同数据时registry快照可以跨实例复用。

### 2、get方法

名字先规整成小写。

按名查行。

不存在抛FileNotFoundError。

ManagedSubagentDefinition.model_validate从行定义构建。

### 3、list方法

返回所有定义。按名字排序。

### 4、create方法

UNIQUE约束把竞争变成干净冲突。

IntegrityError转ManagedSubagentExistsError。

definition用model_dump(mode=json)存储。

### 5、update方法

替换已有定义。

不存在抛FileNotFoundError。

### 6、delete方法

删除并返回是否存在。

### 7、signature方法

COUNT加MAX(updated_at)会漏掉时钟落后的节点的更新。

保留每行的时间戳。

任何定义变化都失效对等进程的registry快照。

元组是(id, updated_at)序列。

## 三、它和谁协作

- ManagedSubagentStore是基类契约。
- ManagedSubagentRow是ORM行。
- get_sync_sessionmaker是共享同步session factory。

## 四、重要性评级

评级是4分。

理由如下。

这个类是managed subagent的SQL存储。

signature保留每行时间戳。防时钟落后节点的更新被漏。

cache_identity让快照复用。

IntegrityError转干净冲突。

这些细节不错。

扣掉6分。

扣分原因是它是直接的CRUD存储。逻辑薄。
