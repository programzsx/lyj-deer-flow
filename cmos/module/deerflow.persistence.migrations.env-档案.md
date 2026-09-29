# deerflow.persistence.migrations.env-档案

## 一、这个模块是干什么的

这个模块是alembic的迁移环境。

alembic是数据库迁移工具。

迁移环境是alembic的入口脚本。

alembic跑stamp和upgrade时执行这个文件。

这个模块只管DeerFlow自己的表。

DeerFlow的表是runs、threads_meta、feedback、users、run_events等。

LangGraph的checkpointer表有自己的结构生命周期。

checkpointer表绝不能被alembic碰。

include_object过滤器明确排除它们。

未来的autogenerate不会为不拥有的表生成drop_table。

## 二、模块里的主要成员

### 1、模块级初始化

模块被导入时做四件事。

第一件事是导入全部模型。

Base.metadata需要有全部表注册。

第二件事是配置alembic日志。

第三件事是注册扩展表前缀。

第四件事是设置target_metadata。

target_metadata是Base.metadata。

#### （1）注册扩展表前缀

这个进程从不启动Gateway。

load_extensions没跑过。

EXTENSION_TABLE_PREFIXES会是空的。

include_object在唯一读它的地方读到空集合。

过滤就静默退化了。

register_configured_extension_table_prefixes直接从config.yaml读声明。

扩展代码从不在这里被导入。

### 2、run_migrations_offline函数

离线模式只生成SQL不连数据库。

配置literal_binds。

配置render_as_batch。

配置include_object过滤器。

### 3、run_migrations_online函数

在线模式连数据库跑迁移。

#### （1）search_path设置

配置了自定义Postgres schema时。

alembic自己创建的引擎要把search_path指向它。

这个引擎从裸URL构建。

它不继承app引擎的server_settings。

没有这个设置的话。

alembic_version和全部迁移DDL会落在public schema。

而app表落在自定义schema。

两边就分开了。

#### （2）SQLite busy_timeout

SQLite时注册事件钩子。

钩子在每个连接上执行PRAGMA busy_timeout=30000。

alembic自己spawn引擎。

那些连接不会继承任何东西。

除非在这个引擎上也装同样的钩子。

跨进程引导时第二个进程要等第一个进程的文件锁。

30秒的等待代替database is locked报错。

### 4、do_run_migrations函数

这个函数在连接上配置context并跑迁移。

render_as_batch=True是SQLite的ALTER TABLE支持必需的。

SQLite不能直接ALTER部分操作。

batch模式用建新表拷数据的方式实现。

## 三、它和谁协作

### 1、它依赖谁

它依赖alembic的context。

它依赖persistence.base的Base。

它依赖_env_filters的过滤器。

它依赖postgres_schema的build_asyncpg_connect_args。

### 2、谁依赖它

bootstrap.py通过alembic command触发它。

make migrate-rev的autogenerate流程也经过它。

versions/下的迁移脚本由它加载执行。

## 四、重要性评级

评级是7分。

理由如下。

全部迁移的执行入口在这里。

search_path的设置防止alembic和app的表分家。

扩展表前缀的注册在这里。

SQLite的busy_timeout在这里对齐。

扣分的原因是它只在迁移时被加载。

普通运行路径不经过它。

逻辑也主要是配置和装配。
