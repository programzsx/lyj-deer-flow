# deerflow.persistence.postgres_schema-档案

## 一、这个模块是干什么的

这个模块集中管理PostgreSQL schema的设置方式。

schema是PostgreSQL里的命名空间。

配置了自定义schema时所有连接都要把search_path指向它。

DeerFlow用两个PostgreSQL驱动。

两个驱动设置search_path的机制不同。

asyncpg只认server_settings。

server_settings通过SQLAlchemy的connect_args传入。

asyncpg不认识libpq的options=-c语法。

psycopg用libpq的options=-c search_path=...参数。

这个模块把两种机制封装成一组函数。

调用方不用关心驱动差异。

这个模块还处理DSN的规范化。

DSN是数据库连接字符串。

## 二、模块里的主要成员

### 1、build_asyncpg_connect_args函数

这个函数给asyncpg构造connect_args。

返回值是{"server_settings": {"search_path": schema}}。

schema为空时返回空字典。

空字典让引擎保持服务器默认值。

### 2、build_psycopg_options函数

这个函数给psycopg构造libpq的options值。

返回值是"-c search_path=<schema>"。

schema为空时返回None。

返回None让调用方跳过这个kwarg。

### 3、dsn_with_search_path函数

这个函数给DSN追加search_path参数。

这个函数处理三种情况。

第一种是无scheme的关键字DSN。

这种情况走psycopg的conninfo转换。

第二种是postgresql://形式的URL。

第三种是postgresql+asyncpg://形式。

psycopg的libpq只认裸的postgres scheme。

+asyncpg后缀会被剥掉。

空格必须编码成%20。

libpq不把+当作空格。

+是HTML表单的约定。

libpq只认%XX百分号编码。

用+的话libpq会看到一个损坏的token。

search_path就永远不会生效。

### 4、normalize_libpq_dsn函数

这个函数剥掉DSN里的+driver后缀。

DatabaseConfig.postgres_url可能带postgresql+asyncpg://后缀。

裸DSN交给psycopg.connect会报难懂的解析错误。

非PostgreSQL的scheme会抛ValueError。

### 5、_merge_search_path_option函数

这个函数合并libpq options。

已有的search_path被替换。

其他参数被保留。

libpq的options用反斜杠转义切分。

这不是POSIX shell引号。

单引号双引号在libpq里是字面字符。

所以不能用shlex.join。

### 6、create_schema_sql函数

这个函数生成CREATE SCHEMA语句。

语句是CREATE SCHEMA IF NOT EXISTS "schema"。

schema在这里做二次校验。

这是纵深防御。

create_schema_sql被公开导出。

psycopg接受多条分号分隔的语句。

未来的调用方绕过DatabaseConfig时也不能注入SQL。

### 7、ensure_postgres_schema函数和ensure_postgres_schema_async函数

这两个函数创建schema。

一个同步一个异步。

用全新连接执行CREATE SCHEMA。

schema为空时是空操作。

psycopg缺失时映射成安装指引。

psycopg3的Connection.__exit__只提交不关闭连接。

这是psycopg2到psycopg3的文档化变更。

所以用try/finally显式关闭。

## 三、它和谁协作

### 1、它依赖谁

它依赖psycopg驱动。

它依赖deerflow.config.postgres_schema的validate_postgres_schema做二次校验。

它依赖deerflow.utils.file_io的await_drained。

### 2、谁依赖它

engine模块的postgres分支用build_asyncpg_connect_args。

migrations/env.py用同一个函数给alembic引擎设置search_path。

checkpointer和同步agent store用build_psycopg_options和dsn_with_search_path。

persistence的AGENTS.md明确要求异步ORM连接和同步agent store连接用同一个search_path。

## 四、重要性评级

评级是8分。

理由如下。

配置了自定义schema时这个模块是唯一入口。

两个驱动的差异全部封装在这里。

%20和+的编码陷阱在这里被处理。

DSN后缀剥离避免难懂的libpq报错。

AGENTS.md点名要求保持search_path不变量。

扣分的原因是没配置自定义schema时这个模块基本是空操作。

多数单机部署不会触发它的主要路径。
