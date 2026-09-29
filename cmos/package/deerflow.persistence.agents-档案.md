# deerflow.persistence.agents-档案

源码路径：backend/packages/harness/deerflow/persistence/agents/__init__.py

## 一、这个包是干什么的

这个包负责自定义agent定义的持久化。

这个包提供两种存储后端。

backend是"file"时，agent定义存在磁盘上。

磁盘布局是每用户一个目录。

目录里放config.yaml和SOUL.md。

这是历史布局，也是默认行为。

backend是"db"时，agent定义存在SQL数据库里。

数据库让多实例部署的每个节点看到相同的agent。

这个包对应数据库里的agents表。

## 二、包里的主要成员

（1）__init__.py的入口函数

make_agent_store(config)根据config.agent_storage.backend建store。

backend是db时，要求database.backend是sqlite或postgres。

memory数据库没有持久URL。

memory数据库会被拒绝。

get_agent_store()返回当前进程的store。

找不到主配置时回退到file后端。

这个回退只服务CLI、测试这类轻量上下文。

配置错误会正常抛出，不会被掩盖。

graph子进程也走这个函数。

graph子进程读同一个config.yaml。

所以graph子进程也能看到db后端。

这一点被测试钉住。

（2）model.py的AgentRow

AgentRow对应agents表。

一行代表一个(user_id, name)自定义agent。

字段如下。

id是代理主键。

id是uuid4 hex。

user_id是属主。

name是agent名。

name存小写。

config是完整的AgentConfig文档。

文档里去掉name。

name单独占一列。

config存成单个JSON文档。

这样做是故意的。

将来给AgentConfig加字段不需要改这里的schema。

新增字段只需要JSON文档能round-trip。

soul是SOUL.md的内容。

created_at和updated_at是时间戳。

(user_id, name)上有UNIQUE约束。

（3）base.py的抽象接口

AgentStore是抽象基类。

方法包括get、exists、get_soul、list、list_all、create、update、delete、signature。

get找不到时抛FileNotFoundError。

调用方靠这个异常返回404。

parse_agent_config(data, name)是共享的解析函数。

这个函数给文档补name。

这个函数剥掉未知key。

display_name无效时只忽略该字段重试。

这是为了老数据不把agent弄坏。

AgentDeleteOutcome有四种结果。

结果是deleted表示删掉了。

结果是legacy表示只有旧共享布局的条目。

结果是missing表示什么都没有。

结果是not-custom-agent表示目录里只有memory数据。

not-custom-agent的目录要保留。

因为那是用户的记忆数据，不能删。

这个store是故意同步的。

消费者是同步代码。

消费者包括graph工厂、setup_agent工具、GitHub registry。

异步HTTP路由用asyncio.to_thread调用它。

（4）sql.py的SqlAgentStore

这个store用同步driver。

sqlite用stdlib，postgres用psycopg。

两个driver都是应用自带的。

engine按URL缓存。

一个进程一个连接池。

sqlite连接也设置同样的PRAGMA。

WAL、synchronous=NORMAL、busy_timeout=30000。

这些和异步engine保持一致。

create撞UNIQUE约束时抛AgentExistsError。

update是upsert语义。

两个并发首次写都走insert。

输家撞约束后重读赢家的行。

然后把更新应用到赢家的行上。

delete返回AgentDeleteOutcome。

行删掉后同时删掉同目录的磁盘memory。

signature()计算所有行的SHA-256摘要。

GitHub registry用这个摘要判断缓存是否新鲜。

时间戳不够用。

因为两次写入可能有同一个时间戳。

（5）file.py的FileAgentStore

读方法是重构前的load_agent_config原逻辑。

写方法用临时文件加os.replace。

写入是原子提交。

create失败会清掉新建的目录。

update失败只清理本次创建的目录。

不碰已存在的agent。

list会跳过坏agent。

一个坏agent不能藏住其余的。

_delete_旧共享布局的agent时故意不动。

signature()用config.yaml的mtime。

## 三、它和谁协作

deerflow.config.agents_config的自由函数分发到get_agent_store()。

Gateway的agents路由调用这个store。

graph工厂make_lead_agent读取agent定义。

GitHub agent registry用list_all和signature。

数据库表agents由持久层的Alembic引导创建。

migration 0006建了这张表。

这个store只读写行。

managed_subagents包复用get_sync_sessionmaker。

## 四、重要性评级

评级：6分。

理由：

自定义agent是面向用户的功能。

用户创建的agent丢失会造成直接体验损伤。

但默认后端是file，db是可选路径。

不配置db时这个包的SQL部分不启用。

agent定义不是运行核心路径的数据。

run和thread_meta才是核心路径。

所以这个包是中等偏上的6分。
