# deerflow.persistence.agents.sql-档案

## 一、这个模块是干什么的

这个模块是SQL后端的自定义agent存储。

存储类叫SqlAgentStore。

SqlAgentStore服务agent_storage.backend为db的路径。

SqlAgentStore是有意同步的。

同步原因是消费者是同步代码。

消费者包括LangGraph图工厂、setup_agent工具、GitHub agent registry。

这些代码可能跑在事件循环上。

也可能跑在和gateway不同的进程里。

异步引擎在这些地方没法驱动。

异步HTTP路由用asyncio.to_thread调用这个store。

这个store用自己的小引擎。

引擎指向异步持久化层管理的同一个数据库。

agents表由那层的alembic引导创建。

这个store只读写行。

sqlite用标准库驱动。

postgres用psycopg驱动。

两个驱动都随应用附带。

所以这里不加新依赖。

## 二、模块里的主要成员

### 1、SqlAgentStore类

SqlAgentStore继承AgentStore。

SqlAgentStore实现全部抽象方法。

#### （1）get方法

get返回agent的config。

先解析有效用户。

然后按(user_id, name)查行。

行不存在时抛FileNotFoundError。

找到行后用parse_agent_config解析。

#### （2）exists方法

exists判断agent是否存在。

#### （3）get_soul方法

get_soul返回soul列。

行不存在返回None。

soul为空也返回None。

#### （4）list方法和list_all方法

list返回某用户的全部agent。

list_all返回全部用户的全部agent。

list_all给GitHub registry用。

#### （5）create方法

create插入新行。

IntegrityError被转换成AgentExistsError。

转换依靠UNIQUE(user_id, name)约束。

检查后写入的竞态被变成干净的冲突。

#### （6）update方法

update是真正的upsert。

行存在时直接更新。

行不存在时插入新行。

两个并发的首次更新可能都看到行不存在。

两个都插入。

UNIQUE约束拒绝输家。

输家重新取赢家的行。

再把更新应用到赢家的行。

不让原始的IntegrityError变成500。

#### （7）delete方法

delete删除行。

行删除后同目录的磁盘memory也被删掉。

原因是memory不能被孤儿化。

行不存在但磁盘目录存在时返回not-custom-agent。

目录被保留。

原因是目录里只有memory数据。

不能删掉用户的memory。

#### （8）signature方法

signature计算全部agent内容的SHA-256摘要。

GitHub registry用这个令牌判断缓存的agent绑定是否仍然新鲜。

只看时间戳不够。

两次写入可能复用同一个数据库时间戳。

摘要只读小的agents表。

### 2、get_sync_sessionmaker函数

这个函数返回进程级的同步会话工厂。

按URL缓存引擎。

多个地方按需构造store。

每个进程应该复用一个引擎和连接池。

锁保证两个线程不会为同一个URL建重复引擎。

managed subagents用同一个引擎。

managed subagents也是被同步的图构建代码读取。

### 3、_build_engine函数

这个函数构建同步引擎。

sqlite连接加check_same_thread=False。

sqlite连接也注册PRAGMA钩子。

钩子执行四条PRAGMA。

四条PRAGMA是WAL、synchronous=NORMAL、外键开启、busy_timeout=30000。

这镜像了异步引擎的PRAGMA。

journal_mode=WAL对数据库文件是持久的。

synchronous和busy_timeout是每连接的。

不设置的话同步连接会跑FULL和默认5秒。

异步引擎是NORMAL和30秒。

两个引擎要行为一致。

并发写入者要等30秒而不是提前失败。

## 三、它和谁协作

### 1、它依赖谁

它依赖agents/base.py的接口和parse_agent_config。

它依赖agents/model.py的AgentRow。

它依赖deerflow.runtime.user_context的get_effective_user_id。

它依赖deerflow.config.paths的get_paths。

### 2、谁依赖它

Gateway的agents路由用它。

LangGraph图工厂用它。

GitHub agent registry用它。

managed_subagents/sql.py复用get_sync_sessionmaker。

## 四、重要性评级

评级是7分。

理由如下。

agent存储的db后端全在这里实现。

upsert的并发冲突处理很完整。

SQLite的PRAGMA对齐保证了两个引擎行为一致。

signature支撑了registry的缓存失效。

扣分的原因是file后端仍然是默认实现。

db后端只在多实例部署里是必需品。
