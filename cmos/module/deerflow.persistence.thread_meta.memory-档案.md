# deerflow.persistence.thread_meta.memory-档案

## 一、这个模块是干什么的

这个模块是内存后端的线程元数据存储。

存储类叫MemoryThreadMetaStore。

这个模块在database.backend为memory时使用。

这个模块包装LangGraph的BaseStore。

数据存在Store的("threads",)命名空间里。

同一个命名空间也被Gateway路由用于线程记录。

## 二、模块里的主要成员

### 1、MemoryThreadMetaStore类

这个类继承ThreadMetaStore。

这个类实现全部抽象方法。

这个类有一个AsyncKeyedLockTable。

锁表按thread_id加锁。

每个变更方法在锁内执行。

#### （1）create方法

create创建线程记录。

memory模式在Phase 1没有projects后端。

create带project_id时抛ProjectNotAssignableError。

失败关闭。

和SQL store对缺失、外来、归档项目的处理完全一样。

路由把异常映射成404。

同一线程已存在且属于别的用户时抛ThreadOwnershipConflictError。

记录带incarnation。

incarnation是uuid。

已有记录的incarnation被继承。

#### （2）claim_unowned方法

认领owner为None的legacy记录。

锁内检查并写回。

#### （3）set_project方法

memory模式不支持成员关系移动。

永远返回False。

#### （4）get方法

get取记录并校验拥有者。

返回可变副本。

#### （5）search方法

search先物化匹配记录。

再在Python里排序。

memory后端分块加载全部匹配行。

再切片。

这样可以镜像SQL的置顶优先排序。

大规模分页要用SQL store。

元数据过滤用json_value_matches。

json_value_matches保证三种后端语义一致。

排序键是(pinned, updated_at, thread_id)。

reverse=True倒序。

#### （6）check_access方法

检查访问权。

行缺失时按require_existing决定。

owner为None时返回True。

#### （7）update_display_name方法

更新显示名并删除选定的旧元数据键。

#### （8）update_status方法

更新状态。

#### （9）update_metadata方法

合并元数据。

touch控制是否刷新updated_at。

#### （10）update_owner方法

移交拥有者。

#### （11）delete方法

删除记录。

### 2、_item_to_dict方法

这个方法把Store的SearchItem转成调用方期望的字典格式。

created_at和updated_at用coerce_iso规范化。

原因是更早的Gateway版本写过unix秒的字符串。

coerce_iso修复这些legacy值。

### 3、_sort_key方法

排序键由三部分组成。

三部分是pinned、updated_at、thread_id。

pinned来自metadata里的置顶键。

## 三、它和谁协作

### 1、它依赖谁

它依赖LangGraph的BaseStore。

它依赖thread_meta/base.py的接口和哨兵。

它依赖json_compat的json_value_matches。

它依赖deerflow.runtime.keyed_lock的AsyncKeyedLockTable。

### 2、谁依赖它

Gateway在memory后端模式时用它存线程元数据。

## 四、重要性评级

评级是6分。

理由如下。

memory模式下的线程元数据全靠这个模块。

json_value_matches的使用保证了跨后端语义一致。

按线程的键控锁保证了单进程内的变更串行。

incarnation的继承在这里。

扣分的原因是memory模式用于单机轻量部署。

生产多实例部署用SQL后端。
