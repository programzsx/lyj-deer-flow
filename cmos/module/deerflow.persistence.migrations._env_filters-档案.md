# deerflow.persistence.migrations._env_filters-档案

## 一、这个模块是干什么的

这个模块存放env.py用到的对象过滤器。

过滤器让alembic只看到DeerFlow自己的表。

数据库里还有别的表。

LangGraph的checkpointer表和DeerFlow的表在同一个数据库里。

checkpointer表归LangGraph管。

没有这个过滤器的话。

alembic revision --autogenerate会反射它们。

然后每个revision都会生成多余的drop_table操作。

扩展持久化的数据也遵循同样的形状。

扩展拥有自己的MetaData和自己的迁移链。

扩展的表也在同一个数据库里。

register_extension_table_prefix让扩展声明自己的表前缀。

这个过滤器也会排除它们。

## 二、模块里的主要成员

### 1、LANGGRAPH_OWNED_TABLES常量

这个常量列出LangGraph拥有的表。

alembic绝不能为这些表提出DDL。

表有四张。

四张是checkpoints、checkpoint_blobs、checkpoint_writes、checkpoint_migrations。

### 2、EXTENSION_TABLE_PREFIXES集合

这个集合存放已加载扩展的表名前缀。

扩展带来自己的MetaData。

扩展的表不在Base.metadata里。

没有这个集合。

autogenerate会反射它们并提出drop_table。

### 3、register_extension_table_prefix函数

这个函数声明一个alembic不能提DDL的表名前缀。

前缀也会匹配到主机自己的表名时大声报错。

比如前缀是run。

run会静默排除主机自己的runs和run_events表。

这必须被抓住。

这里防的是更常见的诚实拼写错误。

不是恶意前缀。

### 4、register_configured_extension_table_prefixes函数

这个函数注册config.yaml里plugins:声明的前缀。

alembic在自己的进程里跑。

alembic进程从不启动Gateway。

load_extensions不会跑。

所以EXTENSION_TABLE_PREFIXES在唯一读它的进程里会是空的。

这个函数直接读声明。

扩展代码从不被导入。

迁移进程不能执行第三方代码。

前缀是config里的普通字符串。

直接解析YAML而不走AppConfig。

AppConfig里无关的验证错误不应该阻止生成revision。

### 5、include_object函数

这个函数是alembic的过滤回调。

签名匹配alembic的include_object约定。

类型是table且属于LangGraph或扩展时返回False。

索引或约束的父表属于那些表时也返回False。

其他情况返回True。

## 三、它和谁协作

### 1、它依赖谁

它按需导入persistence.models和persistence.base。

按需导入让这个模块保持轻量导入。

轻量导入让单元测试不用拖进alembic的导入期机制。

它依赖yaml解析config.yaml。

### 2、谁依赖它

migrations/env.py导入include_object和LANGGRAPH_OWNED_TABLES。

env.py在import时调用register_configured_extension_table_prefixes。

extensions/loader.py的load_extensions调用register_extension_table_prefix。

## 四、重要性评级

评级是6分。

理由如下。

autogenerate的静默drop_table问题全靠这个模块防止。

扩展表前缀的注册机制在这里。

防诚实拼写错误的校验在这里。

这个模块被AGENTS.md的迁移章节明确记载。

扣分的原因是make migrate-rev本身已经安全。

throwaway数据库脚本不会反射任何外部表。

这个过滤器主要保护直接跑alembic的路径。

那条路径很少被用到。
