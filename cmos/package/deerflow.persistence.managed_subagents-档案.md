# deerflow.persistence.managed_subagents-档案

源码路径：backend/packages/harness/deerflow/persistence/managed_subagents/__init__.py

## 一、这个包是干什么的

这个包负责部署级受管subagent定义的持久化。

受管subagent是管理员定义的worker。

定义存在config.yaml之外。

管理员通过管理界面创建这些worker。

这个包提供两种后端。

backend是"db"时定义存在SQL数据库里。

backend是file时定义存在磁盘上。

这个包对应数据库里的managed_subagents表。

## 二、包里的主要成员

（1）base.py的定义模型

ManagedSubagentDefinition是pydantic模型。

字段如下。

name是自然键。

name必须匹配[A-Za-z0-9-]+。

name归一化为小写。

display_name是显示名。

description必填且不能是空白。

system_prompt必填且不能是空白。

tools是可选的工具列表。

disallowed_tools是禁用工具列表。

默认禁用task、ask_clarification、present_files。

这三个是必需的禁用项。

模型校验器强制追加这三个。

skills是可选的技能列表。

model默认inherit。

max_turns默认50。

timeout_seconds默认900。

enabled默认True。

normalize_managed_subagent_name(value)校验并归一化名字。

ManagedSubagentStore是抽象基类。

方法包括get、list、create、update、delete、signature。

cache_identity返回后端目录的进程内标识。

（2）model.py的ManagedSubagentRow

ManagedSubagentRow对应managed_subagents表。

字段如下。

id是主键。

id是uuid4 hex。

name是名字。

name上有UNIQUE约束。

definition是完整定义。

definition存成JSON。

created_at和updated_at是时间戳。

注意这张表没有user_id。

这些定义是部署级的。

部署级意味着不属于任何单个用户。

（3）sql.py的SqlManagedSubagentStore

这个store用同步driver。

复用deerflow.persistence.agents.sql的get_sync_sessionmaker。

get按名字查一个定义。

查不到抛FileNotFoundError。

list返回所有定义。

包括disabled的。

create撞UNIQUE约束时抛ManagedSubagentExistsError。

update替换已有定义。

查不到抛FileNotFoundError。

delete返回是否删掉了。

signature返回(id, updated_at)元组。

用COUNT加MAX(updated_at)不够。

时钟慢的节点的更新会漏掉。

保留每行的时间戳。

任何定义变更都会让peer进程的registry快照失效。

cache_identity返回("db", url)。

这样指向同一数据的实例可以复用registry快照。

（4）file.py的FileManagedSubagentStore

这个store用文件后端。

定义存在managed_subagents_dir下。

写操作持有进程内的_write_lock。

（5）__init__.py的入口

make_managed_subagent_store(config)选择后端。

选择规则和custom agent定义一致。

get_managed_subagent_store(config=None)返回当前store。

找不到配置时回退到file。

## 三、它和谁协作

Gateway的deps.py构造这个store。

Gateway的管理路由调用它。

subagent registry用它读定义。

定义被graph构造代码读取。

读取代码是同步的。

所以store也是同步的。

数据库表由持久层的Alembic引导创建。

migration 0014建了这张表。

## 四、重要性评级

评级：5分。

理由：

受管subagent是管理员配置的数据。

定义丢失会让依赖这些worker的委派失效。

但这张表的数据量很小。

默认后端是file，db是可选路径。

subagent委派本身有内置的通用worker兜底。

这不是运行核心路径。

所以这个包是中等的5分。
