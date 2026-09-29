# deerflow.persistence.mcp_tasks.sql-档案

## 一、这个模块是干什么的

这个模块是长时间运行的MCP任务的SQL仓库。

仓库类叫McpTaskRepository。

这个模块是MCP任务生命周期的持久化核心。

数据库是任务状态的唯一事实来源。

这个仓库实现四套状态机。

四套是轮询、取消、通知、认领释放。

全部变更都用租约加令牌做围栏。

围栏的意思是旧的写入不能覆盖新的认领。

## 二、模块里的主要成员

### 1、McpTaskRepository类

这个类持有会话工厂。

这个类的方法覆盖任务全生命周期。

#### （1）create方法

create插入新任务行。

先锁定当前线程化身。

锁定用_lock_current_thread_incarnation。

线程化身不匹配时抛McpTaskThreadMismatchError。

原因是提交跨过了线程生命周期边界。

唯一约束冲突时抛DuplicateMcpRemoteTaskError。

任务是终态时completed_at立刻设置。

#### （2）get方法和list_by_thread方法

get按任务id取一条。

list_by_thread列出一个线程的任务。

查询都校验线程化身。

化身不匹配的行不可见。

ThreadState只收到有界的当前线程投影。

#### （3）claim_due_tasks方法

这个方法认领到期的轮询任务。

条件是状态可轮询、到期、租约过期或为空。

查询用with_for_update(skip_locked=True)。

skip_locked让多个实例不抢同一行。

认领时写入租约持有者、过期时间、新的claim令牌。

#### （4）apply_snapshot方法

这个方法应用一次轮询快照。

更新是原子围栏的。

围栏条件是租约持有者、令牌、租约未过期、任务非终态、没有取消请求。

旧代的结果不能覆盖新一代的认领。

终态时设置completed_at。

#### （5）release_claim方法

这个方法在轮询失败时释放认领。

条件UPDATE是原子围栏。

只有持有者和令牌都匹配才释放。

连续错误次数达到阈值时事件被标记为追踪降级。

#### （6）request_cancel方法

这个方法持久化用户范围的取消请求。

先锁线程化身。

取消请求会围栏任何进行中的轮询结果。

轮询租约立即释放给取消worker。

重复请求保留已有的取消租约。

重复请求不能触发并发的远端取消。

#### （7）claim_cancel_requests方法和apply_cancel_snapshot方法

claim_cancel_requests认领到期的取消请求。

apply_cancel_snapshot应用取消结果。

取消响应必须报告终态。

否则抛ValueError。

#### （8）claim_notification_work方法

这个方法认领通知工作。

条件是event_version大于notified_version。

事件没被通知过才认领。

认领时重建分发快照。

快照内容是_notification_event的产出。

#### （9）mark_notification_dispatched方法

这个方法把通知标记为已分发。

分发时记录notification_run_id。

#### （10）finish_notification_run方法

这个方法结束一次通知运行。

送达时把notified_version推进到dispatch_version。

更新的事件可能已经到达。

更新的事件保持pending等待重投。

不能被吞掉当作已送达。

未送达时进入retry。

#### （11）dead_letter_notification方法

这个方法停掉一个失败的快照。

事件版本不比分发新时进入dead_letter。

事件版本更新时改为pending。

更新的事件保留给投递。

#### （12）release_notification_claim等方法

release_notification_claim释放通知认领。

release_notification_lease释放意外的通知工作。

defer_dispatched_notification在Agent运行仍活跃时推迟。

### 2、辅助函数

_new_claim_token生成新的认领令牌。

_event_fingerprint计算事件指纹。

指纹是事件内容的SHA-256。

_record_event_if_changed在事件变化时推进event_version。

_lock_current_thread_incarnation锁定线程化身。

SQLite没有行级锁。

SQLite用无操作UPDATE拿数据库写锁。

Postgres用with_for_update读锁。

## 三、它和谁协作

### 1、它依赖谁

它依赖mcp_tasks/model.py的McpTaskRow。

它依赖deerflow.mcp.tasks的状态枚举。

它依赖thread_meta/model.py的ThreadMetaRow做化身校验。

它依赖deerflow.utils.time的coerce_iso。

### 2、谁依赖它

McpTaskService用它管理任务生命周期。

MCP的轮询worker、取消worker、通知worker都通过它认领工作。

## 四、重要性评级

评级是9分。

理由如下。

长时间运行MCP任务的全部状态机在这里。

租约加令牌的围栏设计非常完整。

多实例并发安全靠skip_locked和条件UPDATE。

通知投递的幂等和死信处理都在这里。

这是mcp_tasks目录里最大的文件。

扣分的原因是它只服务MCP任务运行时。

## 四、补充说明

评级是9分。

它和run/sql.py是持久化层里并发设计最复杂的两个仓库。
