# _Entry档案

说明：类清单里有两个_Entry。两个_Entry同名不同源。本档案合并覆盖两处。

- 源码位置一：backend/packages/harness/deerflow/sandbox/acquire_serialization.py
- 源码位置二：backend/packages/harness/deerflow/skills/export.py

## 一、这两个类是干什么的

（一）acquire_serialization.py的_Entry

这个_Entry是获取串行化锁表里的一行。

沙箱供应商需要按key串行化生命周期转换。串行化的实现是每个key一把锁。锁表的每一行是一条_Entry。

_Entry是dataclass。_Entry由AcquireSerializer的_checkout创建。

（二）skills/export.py的_Entry

这个_Entry是技能导出快照里的一条文件记录。

导出要把技能目录打zip包。打zip前先捕获目录快照。快照的每一行是一条_Entry。快照先写到临时文件。打zip时按offset回读。

_Entry是frozen dataclass。

## 二、第一个_Entry的成员

- lock：这个key的threading.Lock。
- refs：引用计数。计数是持有者加等待者。默认0。

refs让锁表的清理准确。refs为0且锁未持有时行从表里弹出。

协作关系。AcquireSerializer的_checkout创建行并refs加一。_checkin在临界区结束后refs减一。refs归零且锁未持有时行被删除。_AsyncAcquire异步路径用同一个entry。

## 三、第二个_Entry的成员

- path：包内相对路径。
- type：类型。file或directory。
- size：字节大小。
- executable：是否可执行位。
- digest：内容摘要。bytes。默认空。
- offset：内容在临时快照里的偏移。默认0。
- identity：文件身份七元组。元组里是st_dev、st_ino、st_mode、st_nlink、st_size、st_mtime_ns、st_ctime_ns。

协作关系。_walk遍历目录时构造它。_manifest按它提取frontmatter。_revision按它算修订号。_capture用两次遍历的列表比对identity。identity不一致说明文件在捕获中变更。变更抛409。

## 四、重要性评级

评级：3分。

理由：两个_Entry都是局部数据载体。第一个是锁表的一行，refs计数让锁表清理准确。第二个是导出快照的一行，identity七元组支撑导出一致性。两个类的逻辑都不在自身。给3分。
