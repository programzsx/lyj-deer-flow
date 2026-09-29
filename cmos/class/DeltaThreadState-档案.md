# DeltaThreadState档案

## 一、这个类是干什么的

DeltaThreadState是ThreadState的delta模式变体。

这个类解决的问题和消息检查点的存储粒度有关。

默认情况下。
ThreadState的messages字段是普通的LastValue通道。
每次保存检查点都会存一份完整的消息列表。
对话越长检查点越大。
存储和传输的开销会持续增长。

DeltaThreadState把messages字段换成了DeltaChannel。
DeltaChannel基于merge_message_writes这个合并函数。
DeltaChannel还带一个快照频率参数。
检查点只在达到设定频率时存完整快照。
其余时候只存增量。
这就是delta模式名字的由来。

这个类的定义非常简短。

```python
class DeltaThreadState(ThreadState):
    messages: DELTA_MESSAGES_FIELD
```

继承ThreadState的全部字段。
只重定义messages一个字段。

这个类在什么场景被使用。
get_thread_state_schema函数在通道模式为delta时返回这个类。
配置里CheckpointChannelMode决定走哪条路径。
默认模式直接返回ThreadState。
delta模式返回DeltaThreadState。

## 二、类的成员（字段、方法，各自做什么）

### （一）字段

- messages：消息列表。类型注解是DELTA_MESSAGES_FIELD。
这个注解由本文件的delta_messages_field函数生成。
生成的内容是Annotated[list[AnyMessage]， DeltaChannel(merge_message_writes， snapshot_frequency=默认快照频率)]。
DeltaChannel的两个关键部分如下。

- 合并函数是merge_message_writes。这个函数用线性时间折叠增量写入。它保留了公开add_messages的全部语义。包括强制转换、消息id分配、删除语义、REMOVE_ALL_MESSAGES处理、空写入报错。
- snapshot_frequency控制完整快照的保存节奏。默认值来自DEFAULT_CHECKPOINT_SNAPSHOT_FREQUENCY。

### （二）继承的成员

- DeltaThreadState继承了ThreadState的全部其他字段。
- sandbox、artifacts、todos、goal、viewed_images、promoted、delegations、skill_context、tool_artifacts等字段全部原样继承。
- 这些字段各自的reducer语义在delta模式下保持不变。

## 三、它和谁协作

### （一）父类

- DeltaThreadState继承自ThreadState。
ThreadState又继承自AgentState。
所以这个类拥有完整的两级继承链。

### （二）同文件的协作函数

- delta_messages_field函数生成messages字段的注解。
- merge_message_writes函数是DeltaChannel的合并逻辑。
- get_thread_state_schema函数在delta模式下返回这个类。
- _delta_thread_state_schema函数负责按快照频率派生变体。

### （三）一个重要的派生关系

_delta_thread_state_schema函数有个特殊处理。
当快照频率等于默认值时直接返回静态的DeltaThreadState。
这样能保持类的身份稳定。
已有的类型检查继续成立。
当快照频率是自定义值时。
函数用get_type_hints复制ThreadState的全部注解。
再替换messages字段。
动态生成一个名叫DeltaThreadState_f{频率}的新TypedDict。

### （四）被谁使用

- get_thread_state_schema根据CheckpointChannelMode选择这个类。
- adapt_state_schema_for_mode能把其他schema也适配成delta形态。
- normalize_middleware_state_schemas会用适配后的schema替换中间件的state_schema。
- 检查点持久化层按这个结构存储增量消息。

## 四、重要性评级（1-10分+理由）

评级是7分。

理由如下。

DeltaThreadState解决的是检查点存储的规模问题。
长对话场景下完整快照的成本会线性膨胀。
delta模式把这个成本压到增量级别。
这对生产环境的数据库压力和响应延迟都有实际意义。

但是这个类的结构本身很小。
它只有一个字段重定义。
核心复杂度都在merge_message_writes和DeltaChannel里。
这个类更像是一个声明式的入口。

依赖它的地方集中在配置和模式选择链路上。
get_thread_state_schema和两个适配函数引用它。
默认模式下系统走的是ThreadState。
只有显式开启delta模式才会用到这个类。

如果删掉这个类。
delta模式就没有了静态载体。
默认快照频率下的delta优化会失效。
但系统仍能以完整快照模式运行。

综合来看。
这个类是重要的性能优化载体。
不是系统不可或缺的枢纽。
评级给7分。
