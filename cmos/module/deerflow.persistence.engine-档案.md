# deerflow.persistence.engine-档案

## 一、这个模块是干什么的

这个模块管理异步SQLAlchemy引擎的生命周期。

引擎是连接数据库的核心对象。

Gateway启动时这个模块创建引擎。

Gateway关闭时这个模块销毁引擎。

这个模块还提供会话工厂。

会话工厂是async_sessionmaker。

各个repository用会话工厂拿数据库会话。

数据库后端支持三种。

三种是memory、sqlite、postgres。

后端是memory时init_engine什么都不做。

get_session_factory返回None。

repository必须检查None。

repository检查到None就回退到内存实现。

## 二、模块里的主要成员

### 1、init_engine函数

init_engine是主入口。

init_engine根据backend参数创建引擎。

#### （1）memory分支

后端是memory时直接返回。

引擎不会被初始化。

#### （2）postgres分支

后端是postgres时先检查asyncpg驱动是否安装。

asyncpg没安装就抛出带安装指引的ImportError。

然后调用build_asyncpg_connect_args构造连接参数。

再用_postgres_engine_kwargs组装引擎选项。

#### （3）sqlite分支

后端是sqlite时先创建目录。

目录创建用asyncio.to_thread放到线程里。

原因是init_engine跑在FastAPI lifespan事件循环上。

同步的os.makedirs会阻塞事件循环。

然后注册连接事件钩子。

钩子在每个新连接上执行四条PRAGMA。

四条PRAGMA是WAL日志模式、synchronous=NORMAL、外键开启、busy_timeout=30000。

WAL让读写可以并发。

busy_timeout放宽到30秒是为了跨进程引导。

第二个Gateway进程可能要等第一个进程跑完建表。

### 2、_postgres_engine_kwargs函数

这个函数组装PostgreSQL引擎的公共选项。

选项包括echo、pool_size、pool_pre_ping、pool_recycle、connect_args、json_serializer。

pool_recycle默认300秒。

300秒在空闲连接变成僵死socket之前回收它。

command_timeout默认30秒。

command_timeout单独限制卡住的ORM查询。

json_serializer用ensure_ascii=False。

ensure_ascii=False让中文字符正常写入JSON。

### 3、_auto_create_postgres_db函数

这个函数自动创建PostgreSQL数据库。

数据库不存在时报"does not exist"错误。

init_engine捕获这个错误。

捕获后连接postgres维护库。

然后执行CREATE DATABASE。

CREATE DATABASE不能在事务里跑。

所以连接用AUTOCOMMIT隔离级别。

### 4、init_engine_from_config函数

这个函数从DatabaseConfig对象初始化引擎。

这是给调用方的便利方法。

调用方不用自己拆配置字段。

### 5、get_session_factory函数

这个函数返回异步会话工厂。

后端是memory时返回None。

### 6、get_engine函数

这个函数返回引擎对象。

引擎没初始化时返回None。

### 7、close_engine函数

这个函数销毁引擎。

销毁用await_drained包裹。

await_drained保证销毁真正完成。

销毁完成前不能释放进程级的所有权。

## 三、它和谁协作

### 1、它依赖谁

它依赖SQLAlchemy的异步引擎设施。

它依赖deerflow.utils.file_io的await_drained。

postgres分支依赖postgres_schema模块的build_asyncpg_connect_args。

引导阶段依赖bootstrap模块的bootstrap_schema。

### 2、谁依赖它

Gateway启动流程调用init_engine。

全部异步repository通过get_session_factory拿会话工厂。

Gateway关闭流程调用close_engine。

## 四、重要性评级

评级是9分。

理由如下。

引擎是整个持久化层的入口。

没有引擎就没有任何数据库访问。

三种后端的切换逻辑集中在这里。

SQLite的WAL调优和Postgres的连接池调优都在这里落地。

自动建库和自动建表让部署变得简单。

扣分的原因是它自己不承载业务数据。

它是基础设施。
