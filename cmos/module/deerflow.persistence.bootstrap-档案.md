# deerflow.persistence.bootstrap-档案

## 一、这个模块是干什么的

这个模块负责数据库表的混合引导。

引导指把数据库结构带到最新版本。

Gateway启动时替换掉无条件的Base.metadata.create_all。

这个模块组合两个思路。

第一个思路是create_all仍然是空库的快速路径。

create_all能忠实渲染Base.metadata。

第二个思路是baseline之后的所有变更都归alembic管。

任何新的列、表、索引必须带一个migrations/versions/下的revision。

## 二、模块里的主要成员

### 1、bootstrap_schema函数

这是顶层入口。

这个函数把数据库结构带到head。

整个流程包在引导锁里。

Postgres用跨进程advisory锁。

SQLite用进程内asyncio锁。

流程分三步。

第一步读取数据库状态。

第二步决定走哪个分支。

第三步执行对应动作。

#### （1）empty分支

数据库里没有DeerFlow的表。

这个分支执行create_all。

然后执行alembic stamp head。

stamp让alembic认为数据库已经在最新版本。

#### （2）legacy分支

数据库里有DeerFlow的表但没有alembic_version。

这是pre-alembic的老数据库。

这个分支先做受限的create_all回填。

回填只创建_BASELINE_TABLE_NAMES里的表。

然后stamp到0001_baseline。

最后upgrade到head。

#### （3）versioned分支

数据库里有一行已知版本的alembic_version记录。

这个分支直接upgrade head。

数据库已经在head时upgrade是空操作。

未知版本、空版本表、多行版本记录都会拒绝启动。

### 2、_postgres_lock函数

这个函数是Postgres的advisory锁上下文管理器。

锁是会话级的。

会话级锁能活过alembic隐式开启的事务。

锁之前先执行SET LOCAL idle_in_transaction_session_timeout = 0。

托管型Postgres默认会杀掉空闲事务会话。

会话被杀会导致advisory锁被静默释放。

第二个Gateway就能并发跑DDL。

这个设置防止这种静默释放。

### 3、_sqlite_lock函数

这个函数是SQLite的进程内锁。

跨进程是尽力而为。

依靠SQLite自己的文件写锁加30秒busy_timeout。

### 4、_run_baseline_create_all_sync函数

这个函数只创建baseline表。

受限是安全属性。

不加限制的create_all会把后续revision引入的表提前建好。

那些revision的op.create_table就会报relation already exists。

这个函数还显式创建baseline时代的索引。

create_all在表已存在时会连同索引一起跳过。

显式创建保证每个baseline索引都存在。

### 5、_validate_forward_schema函数

这个函数校验canonical-0019的表和列是否齐全。

这是存在性检查。

数据库停在一个向前兼容的revision时必须先过这个检查。

缺表或缺列就拒绝启动。

### 6、_FORWARD_COMPATIBLE_REVISION常量

这个常量指向0019_thread_incarnations。

这个revision只加可空列。

rollback-floor的旧二进制可以跳过它。

### 7、_BASELINE_TABLE_NAMES常量

这个常量列出0001_baseline创建的表。

legacy分支的回填被限制在这个集合里。

守卫测试把这个集合和0001的实际输出钉在一起。

### 8、_PG_LOCK_KEY常量

这是Postgres advisory锁的固定键。

两个32位半字随机挑选一次。

目的是不和其他应用的advisory锁冲突。

### 9、_SQLITE_LOCKS字典

这个字典按engine存放SQLite引导锁。

用WeakKeyDictionary。

CPython会回收死对象的地址。

用id(engine)做键会把死engine的锁错配给新engine。

## 三、它和谁协作

### 1、它依赖谁

它依赖alembic的command、Config、ScriptDirectory。

它依赖SQLAlchemy的反射和create_all。

它依赖persistence.base的Base.metadata。

它依赖migrations目录下的env.py。

### 2、谁依赖它

engine模块的init_engine在引擎创建后调用bootstrap_schema。

migrations/versions/下的所有revision通过它被执行。

## 四、重要性评级

评级是9分。

理由如下。

数据库结构升级全靠这个模块。

三种数据库状态各有一条分支。

分支处理覆盖了空库、老库、版本化库、向前兼容库。

并发安全做了分层设计。

Postgres有真正的跨进程串行化。

SQLite有进程内锁加busy_timeout兜底。

幂等revision是最后防线。

扣分的原因是普通开发者很少直接和它交互。

它只在启动时跑一次。
