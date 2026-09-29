# ThreadMetaWriter档案

源码位置：backend/packages/harness/deerflow/tui/persistence.py

## 一、这个类是干什么的

ThreadMetaWriter是一个线程元数据写入器。

Web UI列出会话时读的是threads_meta表。threads_meta表按user_id过滤。嵌入式运行只写checkpointer。不写threads_meta表。这样TUI的线程在Web UI侧栏里是看不见的。

ThreadMetaWriter的作用是补上这个缺口。ThreadMetaWriter往Gateway读的同一个数据库里写threads_meta行。行归属本地默认用户。这样TUI会话能出现在Web UI侧栏。而且这个过程不需要Gateway进程在运行。

ThreadMetaWriter的所有方法都吞掉错误。持久化可见性只是个便利功能。持久化失败不能打断对话。

所有DB工作跑在一个长驻的后台事件循环上。SQLAlchemy异步引擎绑定在创建它的那个循环上。不能每次调用新开一个asyncio.run。新开循环会让连接绑在一次性循环上。

## 二、类的成员

（一）字段

- _loop：后台DB循环。
- _store：线程元数据存储。为None时writer降级为no-op。
- user_id：用户id。固定为DEFAULT_USER_ID。

（二）方法

- ensure_created：确保threads_meta行存在。不存在时创建。metadata默认带source为tui。
- set_title：更新线程的显示名。
- enabled：属性。store非None时为True。

## 三、它和谁协作

（一）构建者

persistence.py的build_persistence函数构建writer。build_persistence在后台循环上初始化共享引擎。数据库是memory后端或初始化失败时，writer降级为no-op。

（二）使用者

app.py的_stream_worker使用writer。运行前调用ensure_created。正常结束后调用set_title。中断的运行不写标题。中断的运行可能只产出了标题中间件的截断猜测。

## 四、重要性评级

评级：3分。

理由：ThreadMetaWriter打通了TUI和Web UI之间的可见性。没有它，TUI创建的会话在Web UI里完全找不到。它的错误吞掉策略保证了对话不受持久化故障影响。但它只影响便利性，不影响核心功能。给3分。
