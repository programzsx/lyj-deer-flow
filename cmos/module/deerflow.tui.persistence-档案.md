# deerflow.tui.persistence-档案

## 一、这个模块是干什么的

这个文件是TUI的共享持久化接线模块。

Web UI从threads_meta SQL表列会话。

不是从checkpointer列。

嵌入式运行只写checkpointer。

TUI的线程在Web UI侧边栏里就看不见。

这个文件补上这个缺口。

它把threads_meta行写进Gateway读的同一个数据库。

写行的所有者是本地默认用户。

不需要Gateway进程在运行。

全部是尽力而为。

数据库是memory后端或不可用时，写入器退化成no-op。

TUI继续正常工作。

## 二、模块里的主要成员

### 1、_LoopThread类

这个类是一个跑单个事件循环的守护线程。

SQLAlchemy的async引擎绑定到创建它的循环。

所以所有数据库工作跑在一个长生命周期的后台循环上。

而不是每次调用开一个新的asyncio.run。

新循环会让连接绑定到用完就丢的循环上。

run方法把协程提交到那个循环并等待。

close方法停止循环。

### 2、ThreadMetaWriter类

这个类为本地默认用户写threads_meta行。

#### （1）enabled属性

store为None时写入器是禁用的。

禁用表示数据库不可用。

#### （2）ensure_created方法

ensure_created确保线程行存在。

不存在才创建。

创建时带assistant_id和元数据。

元数据默认带source为tui。

这个标记让Web UI知道线程来自终端。

#### （3）set_title方法

set_title更新线程的显示标题。

所有方法都吞掉异常。

持久化可见性是便利，不是打断对话的理由。

### 3、build_persistence函数

build_persistence初始化共享引擎并返回写入器。

流程是这样的。

先起后台循环。

再初始化数据库引擎。

再拿session工厂。

工厂存在就创建线程存储。

memory后端没有SQL工厂。

初始化失败退化成no-op写入器。

## 三、它和谁协作

它依赖deerflow.persistence.engine的引擎初始化。

它依赖deerflow.persistence.thread_meta的线程存储。

它依赖deerflow.runtime.user_context的默认用户。

它被tui.session的open_session调用。

它被tui.app的worker使用。

Gateway读同一个数据库就能看到TUI会话。

## 四、重要性评级

评级是5分。

理由是这个文件打通了TUI和Web UI的会话可见性。

没有它，终端会话在Web侧边栏里不可见。

后台循环的绑定处理是对的。

长生命周期循环而不是用完就丢的循环。

不评高分的原因是它是便利功能。

全部no-op时TUI照常工作。
