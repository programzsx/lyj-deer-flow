# 0019_thread_incarnations档案

## 一、这个迁移是干什么的

给线程加可为NULL的化身（incarnation）列。这是expand-only的schema步骤。已有行保持NULL。运行时行为在这个阶段不消费这两个列。

## 二、做了什么schema变更

- 给`threads_meta`加`incarnation`列。VARCHAR(32)。可为NULL。
- 给`mcp_tasks`加`thread_incarnation`列。VARCHAR(32)。可为NULL。

## 三、涉及哪些表

`threads_meta`和`mcp_tasks`。

## 四、重要细节

预检查每个已存在的列后才改表。expand不能静默接受一个窄的、非VARCHAR、NOT NULL、或值默认的手工列。两张表的预检查在DDL之前全部完成。

SQLite降级重试清理。删除被中断的降级尝试留下的批量表。源表缺失时拒绝删除。因为批量表可能是唯一剩下的副本。

`_is_null_server_default`判断反射报告的是"没有默认"还是"SQL NULL默认"。剥掉括号和类型转换后判断。

## 五、重要性评级

评级是6分。

理由。thread incarnation是线程连续性的基础字段。化身让一个线程的生命周期可以被区分。expand-only的设计安全。预检查防止不兼容的手工列被静默接受。
