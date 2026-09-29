# SqlAgentStore-档案

## 一、这个类是干什么的

SqlAgentStore是persistence/agents/sql.py里的类。

它继承AgentStore。

它是SQL支撑的agent store。同步。

服务于agent_storage.backend为db的路径。

它刻意是同步的。用自己的小engine。

engine指向异步持久层管理的同一个数据库。

agents表由该层的Alembic bootstrap创建。迁移0006。

这个store只读写行。

sqlite和postgres同步驱动都随app自带。

不加依赖。

这个类位于backend/packages/harness/deerflow/persistence/agents/sql.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、engine缓存

_engines按URL缓存同步engine。

store在多处按需构造。

gateway路由、图工厂。

每进程复用一个engine和池。

不每次调用开连接。

锁防止两个线程首次触碰同一URL时构建重复engine。

### 2、SQLite PRAGMA

_build_engine镜像异步engine的per-connection PRAGMA。

journal_mode=WAL在DB文件上持久。

异步bootstrap设置了它。

但synchronous和busy_timeout是per-connection。

没有这个这些同步连接跑synchronous=FULL和pysqlite默认5s busy_timeout。

异步engine是NORMAL加30s。

匹配它们让两个engine对共享DB行为一致。

并发写者等最多30秒。不因锁竞争提前失败。

### 3、get和list

get按user_id加小写name查行。不存在抛FileNotFoundError。

list按user排序。

list_all返回所有owner。按user_id加name排序。

parse_agent_config构建AgentConfig。

### 4、create方法

UNIQUE(user_id, name)把check-then-write竞争变成干净的冲突。

IntegrityError转AgentExistsError。

### 5、update方法

upsert语义。

两个并发首次更新都能看到row为None然后都插入。

UNIQUE拒绝输者。

重新取赢者的行并对它应用更新。

不让裸IntegrityError变成500。

真upsert。和create的冲突处理对称。

### 6、delete方法

行删除后移除同址的磁盘内存。

deermem文件后端。

镜像文件后端的rmtree。它打包config加soul加memory。

没有agent行时裸磁盘目录只有memory数据。

db模式下config在行里不在磁盘。

保留它。不rmtree。这对应#4279。

### 7、signature方法

GitHub注册表用它判断缓存的agent绑定是否仍最新。

只靠时间戳不够。

两次写入可能复用同一数据库时间戳。

计算摘要只在registry的缓存新鲜度检查时读小的agents表。

agent数或webhook投递率增长到这个scan变得重要时再考虑。

序列化后SHA-256。

## 三、它和谁协作

- AgentStore是基类契约。
- AgentRow是ORM行。
- get_sync_sessionmaker供managed subagents共享。
- GitHub注册表用signature。

## 四、重要性评级

评级是7分。

理由如下。

这个类是db模式的agent存储。

SQLite PRAGMA对齐防止同步连接锁竞争失败。

upsert语义处理并发首次更新。

delete保护用户内存。

signature的内容摘要防时间戳重用。

这些是多实例部署正确性的关键。

扣掉3分。

扣分原因是它是可选db后端。
