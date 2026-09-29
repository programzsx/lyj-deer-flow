# bootstrap_schema-档案

## 一、这个类是干什么的

bootstrap_schema不是类。

bootstrap_schema是persistence/bootstrap.py里的函数。

它实现schema的混合bootstrap策略。

DeerFlow的应用表由alembic通过混合bootstrap策略管理。

LangGraph的checkpointer表在同一数据库里但由LangGraph拥有。

通过_env_filters.py的include_object从alembic视图排除。

按数据库状态有不同动作。

空数据库用create_all加stamp head。

旧版数据库（有DeerFlow表但没有alembic_version）用受限的create_all基线表加stamp 0001_baseline加upgrade head。

有本地已知alembic_version行的版本化数据库用alembic upgrade head。

未知revision、空版本表、多行版本fail closed拒绝启动。

这个函数位于backend/packages/harness/deerflow/persistence/bootstrap.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、混合bootstrap的五个分支

- 空数据库。create_all加alembic stamp head。
- 旧版数据库。create_all只建基线表加backfill。加alembic stamp 0001_baseline。加upgrade head。
- 版本化数据库。alembic upgrade head。
- 0019_thread_incarnations有全部当前ORM表和列时。警告并跳过迁移。
- 0019_thread_incarnations缺本地表或列时。拒绝启动。需要离线恢复。

### 2、旧版分支的细节

旧版分支处理pre-alembic的数据库。

create_all先跑。

原因是在0001_baseline上stamp会让alembic在后续upgrade里跳过基线自己的create_table DDL。

基线之后才引入Base.metadata的表（例如channel_表）就不会被创建。

第一个请求碰到那张表会500说no such table。

backfill限制在_BASELINE_TABLE_NAMES。

这样也不会创建未来revision引入的表。

那些revision自己的op.create_table否则会失败说relation already exists。

守卫测试把_BASELINE_TABLE_NAMES和0001_baseline.upgrade()的实际输出钉住。

编辑0001加或删表会强制更新常量。

### 3、空数据库分支的细节

空数据库路径继续用create_all。

原因是Base.metadata是唯一权威的schema来源。

create_all正确渲染SQLite和Postgres。

不需要任何人手工保持基线一致。

0001_baseline.upgrade()实践中几乎不执行。

它存在作为stamp目标和链根。

### 4、新ORM列或表

添加新ORM列或表只需要新的revision文件。

不需要编辑bootstrap.py。

除非新revision加新基线表。

## 三、它和谁协作

- persistence/engine.py的init_engine调用它。
- alembic驱动迁移链。
- persistence/migrations的_env_filters.py排除LangGraph表。
- _helpers.py的safe_add_column等幂等helper。

## 四、重要性评级

评级是9分。

理由如下。

这个函数是数据库schema初始化的核心。

它处理了五种数据库状态的分支。

旧版分支的create_all顺序问题真实存在。

顺序错了，基线后引入的表永远不会创建。

第一个请求会500。

backfill限制防止relation already exists。

未知revision fail closed。

每个分支都有明确理由和守卫测试。

它是多实例部署的schema基础。

扣掉1分。

扣分原因是它是初始化时一次性运行的。
