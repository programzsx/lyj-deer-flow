# BoundedDict档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/_bounded_dict.py`

## 一、这个类是干什么的

BoundedDict是一个有容量上限的OrderedDict。

守卫中间件要保存每次run_id的状态。
状态不能无限制增长。
被放弃的运行、被复用的运行都会让长期存活的中间件实例积累条目。

这个模块提供唯一的共享实现。
两个守卫中间件的容量行为完全一致。
未来的守卫不用重新发明。

到达maxsize时最老的条目被淘汰。
插入顺序被保留。所以最久未插入的键先被淘汰。

## 二、类的成员

### （一）字段

- `maxsize`：容量上限。默认1000。

### （二）方法

- `__init__`：接收maxsize。
- `__setitem__`：插入键值。到达上限时先淘汰最老的条目。

## 三、它和谁协作

- LoopDetectionMiddleware用它存停止原因表和线程id表。
- TokenBudgetMiddleware用它存警告标记、待发警告和每消息seen表。

## 四、重要性评级

评级：4/10。

理由：BoundedDict是内存安全的小零件。两个守卫中间件的长期内存安全靠它。代码只有十几行。但正是这种基础设施防止了内存泄漏。所以给4分。