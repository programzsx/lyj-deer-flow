# deerflow.persistence.thread_meta.sql-档案

## 一、这个模块是干什么的

这个模块是SQLAlchemy后端的线程元数据仓库。

仓库类叫ThreadMetaRepository。

ThreadMetaRepository实现ThreadMetaStore接口。

这个模块读写threads_meta表。

这个模块管理线程的创建、查询、更新、删除。

这个模块也管理访问控制。

SQLite和Postgres的差异在这个模块里处理。

## 二、模块里的主要成员

### 1、ThreadMetaRepository类

这个类持有会话工厂。

这个类实现全部抽象方法。

#### （1）create方法

create创建线程行。

AUTO时user_id从contextvar解析。

显式None创建孤儿行。

孤儿行给迁移脚本用。

SQLite时先执行BEGIN IMMEDIATE。

project_id被设置时锁项目行。

锁用with_for_update。

并发的ProjectRepository.delete持有同一个锁。

要么对方先提交。

要么对方等这个事务。

项目缺失、外来或非活跃时抛ProjectNotAssignableError。

不留下悬空的project_id。

#### （2）claim_unowned方法

认领owner为None的legacy行。

用原始table和column构建更新。

返回是否真的改了。

#### （3）set_project方法

原子地把线程移入或移出项目。

SQLite时先BEGIN IMMEDIATE。

project_id不为None时锁项目行。

失败返回False。

updated_at用显式自赋值。

自赋值让onupdate钩子不刷新recency。

#### （4）get方法

get取一个线程。

owner过滤默认强制。

显式None绕过。

#### （5）check_access方法

check_access有两种模式。

两种模式对应一行数据的两种语义。

#### （a）require_existing=False

默认模式。

这是宽松模式。

行缺失、owner为None、owner匹配都返回True。

给读取型装饰器用。

未跟踪的线程当作可访问。

保留向后兼容。

#### （b）require_existing=True

严格模式。

行存在且owner匹配或为None才返回True。

给销毁型装饰器用。

DELETE、PATCH、状态更新都走严格模式。

已经删除的线程不能再被任何调用者命中。

这关闭了删除幂等的跨用户缺口。

行消失会让每个其他用户看起来像拥有它。

#### （6）search方法

search搜索线程。

排序是置顶优先。

置顶用json_match查metadata里的pinned键。

然后按updated_at和thread_id倒序。

owner、status、metadata、archived、project_id都是可选过滤。

metadata过滤用json_match。

全部键被拒绝时抛InvalidMetadataFilterError。

错误信息是逗号分隔的纯字符串。

客户端容易读。

archived过滤用CASE表达式。

CASE让缺失键和非布尔legacy值在两种数据库上行为一致。

project_id用哨兵区分未提供和显式None。

#### （7）update_display_name方法

更新显示名并删除选定的旧元数据键。

原子完成。

SQLite用BEGIN IMMEDIATE。

Postgres用SELECT FOR UPDATE。

#### （8）update_status方法

更新线程状态。

#### （9）update_metadata方法

合并元数据进metadata_json。

行在读写合并前被锁定。

并发的调用者不能覆盖彼此的键。

SQLite在读取前拿写事务。

SQLite的deferred事务要到UPDATE才保留写者。

对读写合并来说太晚了。

BEGIN IMMEDIATE在读取前串行化写者。

包括用同一个文件的其他进程。

touch为False时用flag_modified。

flag_modified让SQLAlchemy在SET里发出当前值。

onupdate钩子被跳过。

recency排序被保留。

#### （10）update_owner方法

移交拥有者。

给内部修复和迁移路径用。

#### （11）delete方法

删除线程行。

### 2、_row_to_dict方法

把行转成字典。

metadata_json被重新映射成metadata。

project_id被映射进metadata的deerflow_project_id键。

时间用coerce_iso规范化。

SQLite丢时区。

输出永远带时区。

## 三、它和谁协作

### 1、它依赖谁

它依赖thread_meta/base.py的接口和常量。

它依赖thread_meta/model.py的ThreadMetaRow。

它依赖json_compat的json_match。

它依赖projects/model.py的ProjectRow做项目校验。

它依赖deerflow.runtime.user_context的AUTO和resolve_user_id。

### 2、谁依赖它

Gateway的threads路由用它做线程CRUD和访问控制。

Projects功能通过set_project移动线程。

## 四、重要性评级

评级是9分。

理由如下。

线程是系统的核心实体。

全部线程的CRUD和访问控制在这里。

check_access的两种模式关闭了删除幂等的跨用户缺口。

SQLite的BEGIN IMMEDIATE和Postgres的FOR UPDATE差异全部处理。

项目分配的原子校验在这里。

AGENTS.md明确要求search的JSON过滤语义跨后端一致。

这是线程数据的权威仓库。
