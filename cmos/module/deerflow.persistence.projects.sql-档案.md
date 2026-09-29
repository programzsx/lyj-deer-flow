# deerflow.persistence.projects.sql-档案

## 一、这个模块是干什么的

这个模块是Projects功能的SQL仓库。

这个模块定义两个repository。

两个repository是ProjectRepository和ProjectDocumentRepository。

ProjectRepository管理项目本身。

ProjectDocumentRepository管理项目架上的文档。

拥有者纪律镜像ThreadMetaRepository。

每个方法用resolve_user_id解析调用者。

解析默认AUTO。

然后按user_id过滤。

外来的项目和缺失的项目不可区分。

调用方把None和False映射成404。

两个repository都不做文件系统工作。

架子的字节是不可变的。

字节带哈希限定。

字节由文档行自己的独占命名空间拥有。

trash和项目删除是纯粹的行状态转换。

## 二、模块里的主要成员

### 1、ProjectRepository类

这个类管理项目本身。

#### （1）create方法

create创建项目。

#### （2）get方法和list方法

get取一个项目。

list列某用户的全部项目。

#### （3）patch方法

patch更新项目属性。

只更新提供的字段。

#### （4）set_status方法

set_status归档或激活项目。

#### （5）delete方法

delete删除项目。

删除在同一个事务里做两件事。

第一件事是清掉threads_meta的成员关系。

第二件事是把全部活跃的project_documents行移入trash。

trash带trash_origin快照。

同一个事务加行锁。

被删的项目绝不留下活跃的架子行。

### 2、ProjectDocumentRepository类

这个类管理项目架文档。

#### （1）insert_active方法

insert_active插入一个活跃文档。

插入前锁活跃项目。

插入在一个事务里。

#### （2）find_active_by_sha256方法

按内容哈希找活跃文档。

#### （3）list_active方法和count_active方法

列出和计数活跃文档。

#### （4）shelf_snapshot方法

给整个架子拍快照。

返回文档列表加总数。

#### （5）get方法

取一个文档。

默认只看未trash的。

include_trashed为True时也看被trash的。

#### （6）trash方法

trash一个文档。

trash是可恢复的。

trash_origin记录原始位置。

#### （7）trash_all_for_project方法

trash一个项目的全部文档。

#### （8）stage_live_copy方法和convert_under_live_lock方法

在活跃项目的行锁下暂存活拷贝。

再在同一个锁下完成转换。

#### （9）restore方法

restore从trash恢复文档。

#### （10）list_trashed和count_trashed和list_all_trashed方法

列出和计数被trash的文档。

#### （11）purge_candidates方法和purge方法

purge_candidates找出超过保留期的trash候选。

purge真正删除。

保留期按天算。

### 3、ProjectNotAssignableError异常

线程不能分配到项目时抛这个异常。

分配失败的原因是项目缺失、外来或已归档。

## 三、它和谁协作

### 1、它依赖谁

它依赖projects/model.py的两个模型。

它依赖thread_meta/model.py的ThreadMetaRow清成员关系。

它依赖deerflow.runtime.user_context的resolve_user_id。

它依赖deerflow.utils.file_io的await_drained。

### 2、谁依赖它

Gateway的projects路由用它管理项目和文档。

thread_meta/sql.py的create和set_project校验ProjectRow。

## 四、重要性评级

评级是6分。

理由如下。

Projects功能的全部持久化逻辑在这里。

项目删除的原子性处理很完整。

成员关系清空和架子trash在同一个事务里。

trash层的恢复和清除在这里。

扣分的原因是Projects是组织功能。

不参与运行核心链路。

文档字节本身不归这个模块管。
