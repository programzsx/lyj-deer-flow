# deerflow.persistence.thread_meta-档案

源码路径：backend/packages/harness/deerflow/persistence/thread_meta/__init__.py

## 一、这个包是干什么的

这个包负责会话（thread）元数据的持久化。

thread是用户和Agent对话的会话。

每个会话有一条元数据。

这个包存会话的属主、显示名、状态、元数据。

这个包还负责会话的访问控制和搜索。

这个包对应数据库里的threads_meta表。

## 二、包里的主要成员

（1）model.py的ThreadMetaRow

ThreadMetaRow对应threads_meta表。

一行代表一个会话。

字段如下。

thread_id是主键。

incarnation是会话化身。

incarnation是uuid4 hex。

会话重建时换新化身。

assistant_id是哪个agent。

assistant_id有索引。

user_id是属主。

user_id有索引。

project_id是所属项目。

project_id有索引。

display_name是显示名。

status是会话状态。

默认idle。

metadata_json是元数据JSON。

created_at和updated_at是时间戳。

（2）base.py的抽象接口

ThreadMetaStore是抽象基类。

方法包括create、claim_unowned、set_project、get、search。

方法还有update_display_name、update_status、update_metadata、update_owner、check_access、delete。

所有方法接受三态user_id。

AUTO从请求上下文的contextvar解析。

显式字符串原样使用。

显式None绕过属主过滤。

None只给迁移和CLI用。

跨组件元数据键有三个。

键是deerflow_pinned、deerflow_archived、deerflow_project_id。

这些键要和前端的utils.ts保持同步。

PROJECT_FILTER_UNSET是search的哨兵。

哨兵区分"没传project过滤"和"显式查未指派的"。

InvalidMetadataFilterError表示所有元数据过滤键都被拒绝。

ThreadOwnershipConflictError表示create会覆盖别人的会话。

（3）sql.py的ThreadMetaRepository

这个类是SQL实现。

方法如下。

create创建会话行。

create生成incarnation。

带project_id时在同一事务里验证项目。

项目行用SELECT FOR UPDATE锁住。

SQLite上这个子句渲染为空。

并发删除项目要么先提交要么等这个事务。

锁不到就抛ProjectNotAssignableError。

不会留下悬空的project_id。

claim_unowned原子地认领属主为NULL的遗留行。

只有把user_id从NULL改成owner才算成功。

set_project原子地把会话移入移出项目。

项目验证和create相同。

set_project故意不碰updated_at。

不碰updated_at才不影响列表排序。

get按thread_id查一个。

带owner过滤。

check_access检查用户能否访问会话。

有两种模式。

require_existing=False是宽松模式。

行缺失、属主为NULL、属主匹配都返回True。

宽松模式给读型装饰器用。

遗留未跟踪的会话保持可读。

require_existing=True是严格模式。

只有行存在且属主匹配或属主为NULL才返回True。

严格模式给破坏型装饰器用。

DELETE、PATCH、状态更新用严格模式。

已删除的会话不能被任何人重新指向。

这堵住了删除幂等的跨用户漏洞。

search搜索会话。

置顶的排前面。

pinned用CASE表达式判断。

同组内按updated_at和thread_id倒序。

支持status过滤。

支持metadata过滤。

metadata过滤用json_match。

不安全的键被跳过。

全部被拒时抛InvalidMetadataFilterError。

错误信息是排序的逗号分隔纯字符串。

方便客户端读。

支持archived过滤。

CASE对缺失键、JSON null、非布尔遗留值统一处理。

SQLite和Postgres行为一致。

支持project_id过滤。

过滤先于分页。

update_display_name更新显示名并原子地移除指定元数据键。

update_status更新状态。

update_metadata把元数据合并进metadata_json。

合并前先锁行。

SQLite在读取前拿写事务。

BEGIN IMMEDIATE串行化写者。

行级锁的数据库用SELECT FOR UPDATE。

并发调用不能互相覆盖对方的键。

touch参数控制是否刷新updated_at。

pin和unpin传touch=False。

这样pin操作不影响会话在列表里的位置。

不刷新时用flag_modified保持updated_at原值。

update_owner把会话行移给新属主。

只给可信的内部修复和迁移用。

delete删除会话行。

SQLite用BEGIN IMMEDIATE。

Postgres用SELECT FOR UPDATE。

删除前先锁行。

（4）memory.py的MemoryThreadMetaStore

这个类包装LangGraph BaseStore。

memory模式用这个实现。

数据存在LangGraph Store的("threads",)命名空间。

（5）__init__.py的make_thread_store

这个工厂函数根据可用后端建store。

有session_factory就返回SQL实现。

没有session_factory就返回内存实现。

两个都没有就报错。

## 三、它和谁协作

Gateway的deps.py用make_thread_store构造store。

Gateway的threads路由用它服务会话CRUD。

Gateway的services.py用它。

run包、projects包、mcp_tasks包都引用ThreadMetaRow。

thread_incarnation被mcp_tasks用作生命周期校验。

project_id被projects包用作归属关系。

check_access被认证装饰器用。

这个仓库依赖engine.py的session工厂。

owner过滤依赖deerflow.runtime.user_context。

## 四、重要性评级

评级：10分。

理由：

thread是用户可见的核心实体。

每个会话都有一条元数据。

属主隔离靠这张表。

访问控制靠check_access。

会话列表靠search。

thread和project、mcp任务的生命周期关联靠incarnation和project_id。

丢这张表等于丢全部会话组织和权限。

所以这个包是最高分。
