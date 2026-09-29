# deerflow.runtime.store-档案

## 一、这个包是干什么的

这个包是LangGraph Store的工厂。

Store是LangGraph的键值存储。
Store用来存放跨线程的共享数据。
例如记忆条目。
例如命名空间下的键值对。

这个包负责按配置创建正确的Store实例。
它支持三种后端。
后端是memory、sqlite、postgres。

这个包提供两种形态的工厂。
异步工厂服务于FastAPI长驻服务。
同步工厂服务于CLI工具和嵌入式客户端。

## 二、包里的主要成员

### （一）模块__init__.py——公共出口

这个模块重新导出两个工厂的公共API。

- `make_store`来自异步工厂。
- `get_store`、`reset_store`、`store_context`来自同步工厂。

异步用法是FastAPI lifespan场景。
同步用法是CLI和`DeerFlowClient`场景。

### （二）模块provider.py——同步工厂

#### 1、_resolve_store_config函数

这个函数解析Store的后端配置。
解析遵循一个优先级。
已废弃的checkpointer配置节优先。
没有checkpointer配置节时，统一的database配置节生效。
这保证Store和Checkpointer使用同一个后端。

database配置节为memory时返回内存后端。
database配置节为sqlite时返回sqlite后端和路径。
database配置节为postgres时返回postgres后端和连接串。
postgres要求必须提供postgres_url。
缺失时抛出ValueError。

#### 2、_sync_store_cm函数

这是一个上下文管理器。
它按配置创建并清理同步Store。

memory后端用`InMemoryStore`。
sqlite后端用`SqliteStore`。
sqlite需要安装langgraph-checkpoint-sqlite包。
postgres后端用`PostgresStore`。
postgres需要安装postgres extra。
postgres会先创建配置的schema再建表。

#### 3、get_store函数

这个函数返回全局同步Store单例。
第一次调用时创建。
之后调用复用。

配置解析在锁外完成。
配置加载可能重置持久化单例。
在锁外解析避免锁顺序反转。
实际的创建在锁内完成。
双重检查保证只创建一个实例。

#### 4、reset_store和store_context

`reset_store`重置单例。
它关闭打开的后端连接。
它强制下次调用重新创建。
它用于测试和配置变更后的场景。

`store_context`是一次性上下文管理器。
它不缓存实例。
每个with块创建并销毁自己的连接。
它用于需要确定性清理的CLI脚本和测试。

### （三）模块async_provider.py——异步工厂

#### 1、_async_store函数

这是异步版的上下文管理器。
memory用`InMemoryStore`。
sqlite用`AsyncSqliteStore`。
postgres用`AsyncPostgresStore`。

sqlite和postgres的创建都包在`drained_async_context`里。
这个包装保证关闭操作被排干。
关闭不会被调用方取消打断。

#### 2、make_store函数

这是公共异步入口。
它接受可选的AppConfig。
不传时从全局配置读取。
它按解析出的配置构造Store。
FastAPI lifespan这样使用它。

### （四）模块_sqlite_utils.py——共享工具

#### 1、resolve_sqlite_conn_str函数

这个函数准备SQLite连接串。
特殊字符串原样返回。
特殊字符串是`:memory:`和`file:`开头的URI。
普通文件路径通过`resolve_path`解析成绝对路径。

#### 2、ensure_sqlite_parent_dir函数

这个函数为SQLite文件路径创建父目录。
内存数据库和URI不需要这一步。

这个模块被Store和Checkpointer两个工厂共享。
连接串规则只定义一次。

## 三、它和谁协作

上游是配置系统。
`get_app_config`提供database配置节。
`get_checkpointer_config`提供旧版checkpointer配置节。

下游是LangGraph。
Store实例是`langgraph.store.base.BaseStore`。
记忆读写都走这个实例。

消费者有两类。
Gateway在FastAPI lifespan里用`make_store`创建异步实例。
`DeerFlowClient`和CLI工具用`get_store`创建同步单例。

它和checkpointer工厂是兄弟关系。
两者共享`_sqlite_utils`和postgres schema工具。
两者遵循同样的后端解析优先级。

## 四、重要性评级

评级：7分。

理由如下。

这个包是记忆持久化的入口。
没有它，跨线程记忆就无法落地。
约12个文件直接引用这个包。

它不是每次运行的必经路径。
默认配置用内存后端。
运行的核心状态走RunStore而不是Store。
Store只承载跨线程共享数据。

它的实现是工厂胶水。
复杂度集中在配置解析和后端选择。
代码量小，但语义明确。

删除它，嵌入式客户端和CLI失去Store来源。
Gateway的lifespan创建失败。
跨线程记忆功能整体不可用。
但运行主路径仍然可以工作。
