# deerflow.persistence-档案

源码路径：backend/packages/harness/deerflow/persistence/__init__.py

## 一、这个包是干什么的

这个包是整个DeerFlow数据库持久层的总入口。

这个包管理DeerFlow自己的应用数据。

这些应用数据包括run元数据、thread归属关系、定时任务、用户账号。

这个包和LangGraph的checkpointer完全分开。

LangGraph的checkpointer管理图执行状态。

这个包管理应用业务数据。

两者互不干涉。

这个包本身只做一件事。

这件事是把engine的初始化和关闭函数导出去。

使用者只需要一行导入。

```python
from deerflow.persistence import init_engine, close_engine, get_session_factory
```

真正的逻辑在三个兄弟模块里。

这三个模块是engine.py、base.py、bootstrap.py。

## 二、包里的主要成员

这个包的__init__.py只导出四个函数。

这四个函数都来自deerflow.persistence.engine。

（1）init_engine

这个函数创建异步engine和session工厂。

这个函数支持三种backend。

backend是"memory"时，init_engine什么都不做。

get_session_factory()会返回None。

各个仓库必须检查None。

检查到None就回退到内存实现。

backend是"sqlite"时，init_engine先建目录。

目录创建放在asyncio.to_thread里。

这样做是为了不阻塞FastAPI lifespan事件循环。

每个新连接都通过事件监听器开启WAL模式。

WAL让读写并发不互相阻塞。

还设置了synchronous=NORMAL。

还把busy_timeout加宽到30秒。

默认5秒对跨进程bootstrap太紧。

backend是"postgres"时，init_engine要求装了asyncpg。

没装就报错并给出安装指引。

连接池带pool_pre_ping。

连接回收周期是300秒。

命令超时是30秒。

json_serializer用ensure_ascii=False。

这样中文字符不会被转义。

（2）get_session_factory

这个函数返回异步session工厂。

backend是memory时返回None。

（3）get_engine

这个函数返回engine实例。

没初始化时返回None。

（4）close_engine

这个函数在进程退出前销毁engine。

销毁动作会等待drain完成。

这样宿主取消不会把还在关闭的连接池丢下。

init_engine还内置了schema引导逻辑。

引导逻辑是混合式的。

空数据库走create_all加alembic stamp head。

遗留数据库走create_all补建基线表加stamp baseline加upgrade head。

已管理的数据库走alembic upgrade head。

Postgres数据库不存在时会自动CREATE DATABASE。

自动建库连到postgres维护库执行。

CREATE DATABASE必须在AUTOCOMMIT隔离级别下运行。

建库失败后engine会重建。

重建的engine保留同样的connect_args。

这样重试的bootstrap还是落在目标schema里。

## 三、它和谁协作

base.py提供Base类。

Base是所有ORM模型的声明基类。

Base提供通用to_dict()方法。

to_dict用SQLAlchemy的inspect()取列。

列key按mapper顺序缓存。

缓存用@cache装饰。

缓存永不失效。

因为映射在类定义时就固定了。

Base还提供标准__repr__。

bootstrap.py负责混合式schema引导。

bootstrap的完整状态机在persistence/bootstrap.py。

AGENTS.md规定了生命周期纪律。

Postgres bootstrap持有session级advisory锁。

pg_advisory_unlock完成前要drain。

反复取消不能把还持锁的session还给池。

engine.py是Gateway启动时初始化的。

各个repository从这个工厂拿session。

repository的完整列表见同目录下各个子包的档案。

## 四、重要性评级

评级：10分。

理由：

这个包是整个持久层的地基。

init_engine是所有数据库功能的前置条件。

没有engine就没有session。

没有session所有repository都无法工作。

engine关闭不当会泄漏连接。

backend选择错误会导致数据不落地。

schema引导错误会导致表缺失。

表缺失会让第一个请求直接500。

所以这个包是最高分。
