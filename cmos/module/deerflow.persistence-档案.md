# deerflow.persistence包档案

## 一、这个模块是干什么的

deerflow.persistence包是应用持久化层的包门面。

源文件是backend/packages/harness/deerflow/persistence/__init__.py。

它的角色是薄门面加职责声明。

它只暴露引擎相关的四个函数。

docstring说明了这个层的定位。

定位是DeerFlow应用数据持久化。

实现是SQLAlchemy 2.0异步ORM。

这个层管理的数据包括运行元数据、线程所有权、定时任务、用户。

docstring还划清了一个关键边界。

边界是这个层与LangGraph的checkpointer完全分离。

checkpointer管理图执行状态。

这个层管理应用数据。

两者不混。

docstring还给出了使用示例。

示例是from deerflow.persistence import init_engine, close_engine, get_session_factory。

## 二、模块里的主要成员

它从engine模块导入四个成员。

成员是init_engine、close_engine、get_engine、get_session_factory。

init_engine初始化数据库引擎。

close_engine关闭引擎。

get_engine获取引擎。

get_session_factory获取会话工厂。

四个成员在__all__里。

实体相关的子包不经过这个门面暴露。

实体子包包括agents、run、thread_meta、feedback、user等。

调用方直接导入实体子包。

## 三、它和谁协作

它向内依赖engine模块。

engine.py实现数据库引擎的完整生命周期。

它下面挂着大量实体子包。

实体子包包括agents、channel_connections、feedback、managed_subagents、mcp_tasks、models、personal_access_tokens、projects、run、scheduled_task_runs、scheduled_tasks、subagent_batches、thread_meta、user、webhook_delivery。

每个实体子包管理一类应用数据。

它向外被runtime、app层和全部实体子包消费。

runtime.events.store.db通过get_session_factory拿到会话工厂。

它还与deerflow.persistence.models协作。

models子包是全部ORM模型的注册入口。

## 四、重要性评级

评级是8分。

理由如下。

它是应用持久化的正式入口。

init_engine和get_session_factory是全系统访问数据库的两个必经函数。

docstring里与checkpointer的分离声明是架构上最重要的边界之一。

分离让应用数据和图状态互不干扰。

扣分点在于它的门面只覆盖引擎。

实体子包全部要深路径导入。

门面覆盖不完整。

这是刻意的。

实体太多，全导出会让门面失控。
