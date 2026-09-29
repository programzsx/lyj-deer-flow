# deerflow.runtime.checkpointer.cached_saver-档案

## 一、这个模块是干什么的

这个文件是delta历史缓存的路过式缓存包装器。

它包装任意的BaseCheckpointSaver。

它只重写一个行为。delta通道历史的读取。

其他全部行为直接委托给内部的saver。

正确性论证是这样的。一个检查点的delta历史是它已封存的祖先链的纯函数。LangGraph契约排除了目标自己的pending writes。父链接在创建时固定。祖先的写入在它的子存在后就封存了。

所以按(线程,命名空间,检查点id,通道)键控的条目是不可变的。

不可变意味着不需要失效。共享后端跨进程也是一致的。

包装器从不缓存"最新检查点"的解析。只缓存按已解析的不可变检查点id键控的历史。

数据生命周期是这样的。线程删除和prune清理该线程的缓存条目。源真值删除不能在缓存里留下残留的历史载荷。run级删除无法廉价映射回线程。靠LRU和TTL兜底。

## 二、模块里的主要成员

### 1、CachedHistorySaver类

这个类继承BaseCheckpointSaver。

#### （1）初始化和委托

__init__保存内部saver、缓存、键前缀。serde直接复用内部saver的实例属性。这遮蔽了基类的默认序列化器。

__getattr__是安全网。saver特有的额外属性直接转发给内部saver。基类方法被显式委托。所以这个只对基类没定义的属性生效。

#### （2）键构建

_key用make_history_key构建缓存键。

键由前缀、线程id、命名空间、检查点id、通道组成。命名空间、检查点id、通道用NUL分隔后SHA256哈希。线程id保持可读。这样运维调试方便。含冒号的命名空间不会产生歧义键。

#### （3）aget_delta_channel_history异步路径

这是被重写的核心行为。

channels为空返回空字典。

缓存禁用时直接走内部saver的全量遍历。全miss的组合比原始遍历更费。

先取目标检查点的tuple。没有目标就走全量遍历。

然后按通道查缓存。命中的直接用。缺失的走组合或遍历。

缺失的通道组合完成后写回缓存。

返回每个通道的结果。全部miss时返回空writes。

#### （4）_aresolve递归组合

这是组合逻辑。

delta历史是累积的。父的历史加父上这个通道的写入。

它递归向上找最近的已缓存的祖先。

父的checkpoint里有这个通道的channel_values时。说明父本身是一个快照点。直接用父的值做种子。这就是稳态命中。通常两三层内命中。

缓存里有父的历史时用缓存。

深度预算耗尽时委托一次内部saver的快速遍历。一次遍历两条SQL。比逐个爬祖先快。祖先下面保持冷。以后解析时向上递归到最近的暖层。暖前沿跟着run走。

组合的每一层都被缓存。所以稳态下每步只有一两个新检查点要算。

_COMPOSE_MAX_DEPTH是8。稳态run需要约2层。更深的冷链用一次暖链遍历更快。

#### （5）get_delta_channel_history同步路径

这是同步孪生。逻辑相同。同步路径只支持memory缓存后端。TUI和嵌入式用。其他缓存后端抛TypeError。

#### （6）删除和清理

delete_thread删除内部saver的线程数据。然后清理缓存里该线程的条目。

adelete_thread是异步版本。

prune修剪会重写线程的链。所以修剪后清理这些线程的缓存。不清理的话缓存会引用已删除的祖先。

delete_for_runs不清理缓存。run级删除无法廉价映射回线程。残留条目保持正确。由LRU和TTL约束。

#### （7）统计

stats返回缓存统计。包括命中、未命中、淘汰数。加上组合命中和全量遍历次数。

## 三、它和谁协作

它继承langgraph的BaseCheckpointSaver。

它依赖runtime.checkpoint_cache.base里的make_history_key。

它的缓存后端由runtime.checkpoint_cache.provider分配。memory或redis。

它被checkpointer的两个provider在delta模式下包装saver。

它是delta模式的性能关键组件。

## 四、重要性评级

评级是8分。

理由是这个文件是delta模式的性能关键。

没有它，delta模式下每步都要从底向上遍历全部检查点。成本随轮数线性增长。

递归组合加缓存的暖前沿设计让稳态成本降到接近常数。

不可变性论证让缓存免于失效逻辑。

不评更高分是因为它只在delta模式下启用。full模式完全绕过它。
