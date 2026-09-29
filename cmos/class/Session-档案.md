# Session档案

源码位置：backend/packages/harness/deerflow/tui/session.py

## 一、这个类是干什么的

Session是TUI的嵌入式会话。

Session负责三件事。

第一。Session持有DeerFlowClient实例。DeerFlowClient带一个持久化checkpointer。checkpointer让线程状态能跨轮保存。

第二。Session负责线程解析。--continue要恢复最近的线程。--resume要按id或标题恢复线程。这些解析都在Session里做。

第三。Session持有共享持久化的writer。writer让TUI会话出现在Web UI侧栏。Session还持有后台DB循环。close方法负责停掉循环、释放引擎。

线程解析的细节是这样的。resolve_ref先按id精确匹配。匹配不到再按标题精确匹配。都匹配不到时回退到字面量。字面量回退前要做校验。校验保证字面量满足线程id规范。校验通过后字面量被当作新线程的id继续用。

## 二、类的成员

（一）字段

- client：DeerFlowClient实例。
- writer：ThreadMetaWriter。默认是None。无头模式不配writer。
- _loop：后台DB循环。默认是None。

（二）方法

- resolve_thread：按启动计划解析线程id。--resume优先。--continue取最近一条线程。
- resolve_ref：把线程引用解析成线程id。先匹配id，再匹配标题，最后校验字面量。
- _validated_literal_ref：校验字面量引用。校验失败抛ValueError。
- recent_threads：列出最近的线程。
- close：停止后台DB循环。释放引擎。尽力而为。

（三）模块级函数

- open_session：构建Session。persistence参数控制是否创建writer和后台循环。无头一次性运行传False。这样避免为一个要丢弃的连接池拉起事件循环。

## 三、它和谁协作

（一）上层

app.py的DeerFlowTUI和run_tui使用Session。cli.py的_run_print和_run_json也用Session。

（二）持久化

Session用persistence.py的build_persistence构建writer和循环。close时用deerflow.persistence.engine的close_engine释放引擎。

（三）客户端

Session构造DeerFlowClient。DeerFlowClient来自deerflow.client。

## 四、重要性评级

评级：4分。

理由：Session是TUI和嵌入式运行时之间的接线层。所有TUI功能都通过Session拿到client。线程解析逻辑（id优先、标题次之、字面量兜底加校验）都在这里。缺了Session，TUI无法启动。但它不承载对话逻辑。给4分。
