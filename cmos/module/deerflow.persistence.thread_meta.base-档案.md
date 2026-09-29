# deerflow.persistence.thread_meta.base-档案

## 一、这个模块是干什么的

这个模块定义线程元数据存储的抽象接口。

线程元数据是每个会话线程的描述信息。

元数据包括名字、状态、拥有者、归档标记、项目归属。

存储有两种实现。

第一种是ThreadMetaRepository。

ThreadMetaRepository是SQL后端。

用SQLAlchemy访问sqlite或postgres。

第二种是MemoryThreadMetaStore。

MemoryThreadMetaStore是内存后端。

包装LangGraph的BaseStore。

全部变更和查询方法都接受user_id参数。

user_id有三态语义。

三态语义是AUTO、显式id、显式None。

## 二、模块里的主要成员

### 1、元数据键常量

#### （1）THREAD_PINNED_METADATA_KEY

这个常量是置顶标记的键。

键名是deerflow_pinned。

#### （2）THREAD_ARCHIVED_METADATA_KEY

这个常量是归档标记的键。

键名是deerflow_archived。

#### （3）THREAD_PROJECT_METADATA_KEY

这个常量是项目归属的键。

键名是deerflow_project_id。

三个键都是跨组件元数据键。

键必须和前端保持同步。

同步位置是frontend/src/core/threads/utils.ts。

还有frontend/tests/e2e/utils/mock-api.ts。

### 2、PROJECT_FILTER_UNSET哨兵

这个哨兵区分两种情况。

一种情况是search调用没提供project_id过滤。

另一种情况是显式要求未分配的线程。

search的project_id参数默认是这个哨兵。

显式None表示查未分配的线程。

### 3、异常类

InvalidMetadataFilterError继承ValueError。

全部客户端元数据过滤键都被拒绝时抛这个异常。

ThreadOwnershipConflictError继承Exception。

create会覆盖别的用户拥有的线程时抛这个异常。

### 4、ThreadMetaStore抽象类

这是抽象基类。

这个类定义全部存储方法。

#### （1）create方法

create创建线程行。

project_id被设置时在插入事务内校验项目。

校验失败抛ProjectNotAssignableError。

不留下部分行。

#### （2）claim_unowned方法

claim_unowned原子地认领拥有者为None的legacy行。

只有把user_id从None改成owner的那次调用返回True。

行缺失或已被拥有返回False。

#### （3）set_project方法

set_project原子地把线程移入或移出项目。

线程缺失或外来时返回False。

目标项目缺失、外来或已归档时返回False。

不能触碰updated_at。

#### （4）get方法

get取一个线程。

#### （5）search方法

search搜索线程。

archived为None时包含全部线程。

False时也包含没有归档标记的legacy行。

过滤先于分页。

结果置顶线程排前面。

每组内按updated_at和thread_id倒序。

#### （6）update_display_name方法

更新显示名。

可以同时删除选定的旧元数据键。

#### （7）update_status方法

更新线程状态。

#### （8）update_metadata方法

合并元数据进线程的metadata字段。

已有键被新值覆盖。

metadata里没有的键保留。

线程不存在或owner检查失败时空操作。

touch为True时刷新updated_at。

touch为False时不刷新。

pin和unpin不是会话活动。

touch=False让线程保持它在updated_at排序列表里的位置。

#### （9）update_owner方法

把线程行移交给新的拥有者。

给可信的内部修复和迁移路径用。

#### （10）check_access方法

检查用户对线程是否有访问权。

#### （11）delete方法

删除线程行。

## 三、它和谁协作

### 1、它依赖谁

它依赖deerflow.runtime.user_context的AUTO和_AutoSentinel。

### 2、谁依赖它

thread_meta/sql.py的ThreadMetaRepository实现这个接口。

thread_meta/memory.py的MemoryThreadMetaStore实现这个接口。

Gateway的threads路由通过这个接口访问线程。

## 四、重要性评级

评级是7分。

理由如下。

线程是系统的核心实体。

线程访问控制和元数据管理的契约集中在这里。

三态user_id语义在这里被记录。

三个跨组件元数据键在这里定义。

扣分的原因是接口本身没有逻辑。

真正的行为在两个实现里。
